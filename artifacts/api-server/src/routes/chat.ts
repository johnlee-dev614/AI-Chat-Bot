import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { db, messagesTable } from "@workspace/db";
import { eq, and, asc, desc } from "drizzle-orm";
import {
  GetChatHistoryResponse,
  SendMessageBody,
  SendMessageResponse,
  ClearChatHistoryResponse,
} from "@workspace/api-zod";
import { getCharacterBySlug, CharacterConfig } from "../config/characters";

const router: IRouter = Router();

// ─── Shared logger type ──────────────────────────────────────────────────────

type PinoLog = {
  info: (o: object, msg: string) => void;
  warn: (o: object, msg: string) => void;
  error: (o: object, msg: string) => void;
};

// ─── System prompt builder ────────────────────────────────────────────────────
//
// Wraps each character's identity prompt with strict response-quality rules.
// Detects short/greeting messages and tells the model to match that scale.

function buildSystemPrompt(character: CharacterConfig, lastUserMessage: string): string {
  // Characters with their own style rules (e.g. Isabella) already encode all
  // behaviour guidance in their systemPrompt — wrapping them with extra rules
  // dilutes the signal and confuses smaller models.
  if (character.preferredModels) {
    return character.systemPrompt;
  }

  const wordCount = lastUserMessage.trim().split(/\s+/).length;

  // Keep brevity guidance short and model-friendly — small free models get
  // confused by long rule lists and return empty content.
  const brevityNote =
    wordCount <= 4
      ? "The user sent a very short message. Reply in 1–2 sentences only — no monologue, no dramatic opener."
      : wordCount <= 12
      ? "Keep your reply to 2–3 sentences. Be natural and concise."
      : "Reply at a length that fits the conversation naturally.";

  return (
    `${character.systemPrompt}\n\n` +
    `Respond as this character in a real text conversation. ${brevityNote} ` +
    `Sound like a real person, not a roleplay script. Match the energy and scale of what the user wrote. ` +
    `Never open with a dramatic monologue for a simple greeting. ` +
    `Never say assistant phrases like "How can I help you?" or "Certainly!". ` +
    `Just reply as the character would — brief if the user is brief, deeper only when the conversation goes there.`
  );
}

// ─── OpenRouter ───────────────────────────────────────────────────────────────
//
// Model priority: fastest/most-reliable first.
// Each fetch gets its own AbortController with a hard 12-second timeout so one
// slow/hung model never blocks the whole request.

// Model IDs verified against GET /api/v1/models on 2026-04-03.
// Ordered: strongest/most-reliable first. Different providers reduce correlated 429s.
const OPENROUTER_MODELS = [
  "openrouter/free",                          // auto-router — picks best available free
  "openai/gpt-oss-120b:free",                // OpenAI OSS 120B — excellent instruction following
  "nousresearch/hermes-3-llama-3.1-405b:free",// 405B — best at roleplay/character prompts
  "meta-llama/llama-3.3-70b-instruct:free",  // reliable Llama 70B
  "google/gemma-3-27b-it:free",              // large Gemma, good at chat
  "openai/gpt-oss-20b:free",                 // smaller OpenAI OSS fallback
  "nvidia/nemotron-3-super-120b-a12b:free",  // large Nvidia fallback
];

const OPENROUTER_MODEL_TIMEOUT_MS = 12_000; // 12 s per model attempt

// Patterns that indicate a model ignored the system prompt and replied as a generic assistant.
// When detected we skip to the next model in the retry loop.
const GENERIC_ASSISTANT_PATTERNS = [
  /how can i (help|assist) you( today)?[?!]?$/i,
  /what can i (help|assist) you with[?!]?$/i,
  /how (may|can) i assist you[?!]?$/i,
  /i('d| would) be (happy|glad|delighted) to (help|assist)/i,
  /^(certainly|of course|sure thing|absolutely)[!.,]/i,
  /as an ai (language model|assistant|chatbot)/i,
  /i('m| am) (an ai|a language model|here to help)/i,
  /is there (anything|something) (else )?(i can|you'd like me to)/i,
  /feel free to (ask|let me know)/i,
  /i (would |'d )?(love|be happy|be glad) to (help|assist) you with that/i,
];

// Patterns that indicate a model is "thinking out loud" — exposing its reasoning
// process instead of just replying as the character.
const THINKING_LEAK_PATTERNS = [
  /okay,?\s+the user (just )?(said|sent|wrote|asked)/i,
  /now i need to respond/i,
  /i need to respond as/i,
  /looking at the (history|conversation|context)/i,
  /let me (think|craft|write|reply|respond|formulate)/i,
  /i (should|will|need to|must) (respond|reply|engage|keep|make sure)/i,
  /\b(isabella'?s?|character'?s?) rules\b/i,
  /must stay in character/i,
  /this is (explicit|flirty|sensitive)/i,
  /the (user|message) is (asking|saying|requesting)/i,
  /my response (should|will|needs to)/i,
  /so (my |the )?reply (should|will|is)/i,
  /→\s*i (said|replied|responded)/i,   // history recaps like "User said X → I replied Y"
  /user started with/i,
];

function isGenericReply(text: string): boolean {
  return GENERIC_ASSISTANT_PATTERNS.some((re) => re.test(text.trim()));
}

// Detect chain-of-thought leakage. When found, try to salvage the actual reply
// (typically the last short line after all the reasoning). Returns null if we
// can't extract a clean reply — the caller should skip to the next model.
function extractFromThinkingLeak(text: string): string | null {
  const hasLeak = THINKING_LEAK_PATTERNS.some((p) => p.test(text));
  if (!hasLeak) return text; // no leak detected — return as-is

  // Try to find an explicit "Isabella: <reply>" marker the model may have added.
  const markerMatch = text.match(/Isabella:\s*[""]?(.+?)[""]?\s*$/im);
  if (markerMatch) return markerMatch[1].trim();

  // Fall back to the last non-empty line that looks like a real reply
  // (short, doesn't look like more reasoning).
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    // Skip lines that are themselves reasoning or list items
    if (line.length > 180) continue;
    if (/^[-•*]\s/.test(line)) continue;
    if (THINKING_LEAK_PATTERNS.some((p) => p.test(line))) continue;
    if (line.length >= 4) return line;
  }

  return null; // couldn't extract — skip this model
}

async function callOpenRouter(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  log: PinoLog,
  modelList: string[] = OPENROUTER_MODELS,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  log.info(
    { historyLen: history.length, lastRole: history.at(-1)?.role ?? "none" },
    "OpenRouter: building request",
  );

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "https://localhost",
    "X-Title": "Sonuria",
  };

  const errors: string[] = [];
  let genericFallback: string | null = null; // saved if all in-character attempts fail

  for (const model of modelList) {
    log.info({ model }, "OpenRouter: trying model");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_MODEL_TIMEOUT_MS);

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.9,
          max_tokens: 300,
          min_tokens: 10, // prevent empty completions on very short user messages
          include_reasoning: false, // suppress chain-of-thought tokens where supported
        }),
      });

      clearTimeout(timeoutId);

      const rawText = await res.text();

      if (!res.ok) {
        log.warn(
          { model, status: res.status, body: rawText.slice(0, 300) },
          "OpenRouter: HTTP error, trying next model",
        );
        errors.push(`${model} → HTTP ${res.status}`);
        continue;
      }

      const data = JSON.parse(rawText) as {
        choices?: Array<{ message?: { content?: string } }>;
        error?: { message: string; code?: number };
      };

      if (data.error) {
        log.warn(
          { model, errCode: data.error.code, errMsg: data.error.message },
          "OpenRouter: API error body, trying next model",
        );
        errors.push(`${model} → error: ${data.error.message}`);
        continue;
      }

      const rawContent = data.choices?.[0]?.message?.content?.trim();
      if (!rawContent) {
        log.warn(
          { model, raw: rawText.slice(0, 300) },
          "OpenRouter: empty content, trying next model",
        );
        errors.push(`${model} → empty content`);
        continue;
      }

      // Strip chain-of-thought leakage — some models expose their reasoning process
      // instead of just replying as the character. Try to salvage the real reply.
      const content = extractFromThinkingLeak(rawContent);
      if (content === null) {
        log.warn(
          { model, rawLen: rawContent.length, preview: rawContent.slice(0, 120) },
          "OpenRouter: thinking leak detected, could not salvage reply — trying next model",
        );
        errors.push(`${model} → thinking leak, no salvageable reply`);
        continue;
      }

      if (content !== rawContent) {
        log.info(
          { model, rawLen: rawContent.length, cleanLen: content.length },
          "OpenRouter: thinking leak stripped — using salvaged reply",
        );
      }

      // If the model ignored the character prompt and replied as a generic assistant,
      // save it as a last-resort fallback but keep trying for an in-character reply.
      if (isGenericReply(content)) {
        log.warn(
          { model, reply: content.slice(0, 120) },
          "OpenRouter: model ignored character prompt, saving as fallback and trying next",
        );
        if (!genericFallback) genericFallback = content;
        errors.push(`${model} → ignored character prompt`);
        continue;
      }

      log.info({ model, replyLen: content.length }, "OpenRouter: in-character reply");
      return content;

    } catch (err) {
      clearTimeout(timeoutId);
      const isTimeout = (err as Error)?.name === "AbortError";
      log.warn(
        { model, isTimeout, err: String(err) },
        isTimeout ? "OpenRouter: model timed out, trying next" : "OpenRouter: fetch threw, trying next",
      );
      errors.push(`${model} → ${isTimeout ? "timeout" : String(err)}`);
    }
  }

  // If every model either errored or gave a generic reply, use the generic one
  // rather than returning a 502. A slightly off-brand reply is better than nothing.
  if (genericFallback) {
    log.warn(
      { fallback: genericFallback.slice(0, 120), errors },
      "OpenRouter: all in-character attempts failed — using generic fallback reply",
    );
    return genericFallback;
  }

  // Absolute last resort: never 502. Return a short neutral acknowledgment.
  // This path is only hit when every model failed with empty content, timeout, or HTTP error.
  log.error(
    { errors },
    "OpenRouter: all models failed completely — returning hard fallback string",
  );
  return "Mm. Yeah.";
}

// ─── ElevenLabs TTS ──────────────────────────────────────────────────────────

const ELEVENLABS_TIMEOUT_MS = 18_000; // 18 s

async function callElevenLabs(text: string, log: PinoLog): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.VOICE_API_KEY;
  const voiceId = process.env.VOICE_ID;

  if (!apiKey) {
    log.warn({}, "ElevenLabs: no API key — skipping TTS");
    return null;
  }
  if (!voiceId) {
    log.warn({}, "ElevenLabs: VOICE_ID not set — skipping TTS");
    return null;
  }

  const usingKey = process.env.ELEVENLABS_API_KEY ? "ELEVENLABS_API_KEY" : "VOICE_API_KEY";
  log.info({ voiceId, usingKey, textLen: text.length }, "ElevenLabs: sending TTS request");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ELEVENLABS_TIMEOUT_MS);

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.4, similarity_boost: 0.8 },
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "(unreadable)");
      log.error({ status: res.status, body: errBody.slice(0, 300) }, "ElevenLabs: HTTP error");
      return null;
    }

    const audioBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString("base64");
    log.info({ base64Len: base64.length }, "ElevenLabs: audio ready");
    return base64;

  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = (err as Error)?.name === "AbortError";
    log.error(
      { isTimeout, err: String(err) },
      isTimeout ? "ElevenLabs: timed out" : "ElevenLabs: fetch threw",
    );
    return null;
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/chat/:characterSlug/messages — fetch history
router.get("/chat/:characterSlug/messages", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { characterSlug } = req.params;
  const character = getCharacterBySlug(characterSlug);
  if (!character) {
    res.status(404).json({ error: "Character not found" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(
      and(
        eq(messagesTable.userId, req.user.id),
        eq(messagesTable.characterSlug, characterSlug),
      ),
    )
    .orderBy(asc(messagesTable.createdAt));

  res.json(GetChatHistoryResponse.parse({ messages }));
});

// POST /api/chat/:characterSlug/messages — send a message, get AI reply + optional audio
router.post("/chat/:characterSlug/messages", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { characterSlug } = req.params;
  const character = getCharacterBySlug(characterSlug);
  if (!character) {
    res.status(404).json({ error: "Character not found" });
    return;
  }

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ issues: parsed.error.issues }, "SendMessage: invalid body");
    res.status(400).json({ error: "Invalid request body", detail: parsed.error.issues });
    return;
  }

  const { content } = parsed.data;

  req.log.info(
    { characterSlug, userId: req.user.id, messageLen: content.length },
    "SendMessage: received",
  );

  // ── 1. Persist user message ──
  const userMsgId = randomUUID();
  await db.insert(messagesTable).values({
    id: userMsgId,
    userId: req.user.id,
    characterSlug,
    role: "user",
    content,
    createdAt: new Date(),
  });
  req.log.info({ userMsgId }, "SendMessage: user message saved");

  // ── 2. Load conversation history (last 20 messages for context) ──
  // Fetch the most-recent messages first (desc), then reverse to chronological
  // order so the model always sees the latest exchange, not the oldest ones.
  const historyRaw = await db
    .select()
    .from(messagesTable)
    .where(
      and(
        eq(messagesTable.userId, req.user.id),
        eq(messagesTable.characterSlug, characterSlug),
      ),
    )
    .orderBy(desc(messagesTable.createdAt))
    .limit(20);

  const history = historyRaw.reverse(); // restore chronological order for the model

  req.log.info({ historyCount: history.length }, "SendMessage: history loaded");

  // ── 3. Generate AI text reply (OpenRouter) ──
  const systemPrompt = buildSystemPrompt(character, content);
  const modelList = character.preferredModels ?? OPENROUTER_MODELS;
  let aiContent: string;
  try {
    aiContent = await callOpenRouter(systemPrompt, history, req.log, modelList);
  } catch (err) {
    req.log.error({ err: String(err) }, "SendMessage: OpenRouter exhausted all models");
    res.status(502).json({
      error: "Could not reach the AI right now. Please try again in a moment.",
      detail: String(err),
    });
    return;
  }

  req.log.info({ aiReplyLen: aiContent.length }, "SendMessage: AI reply ready");

  // ── 4. Generate voice audio (ElevenLabs, non-fatal) ──
  const audioBase64 = await callElevenLabs(aiContent, req.log);
  req.log.info({ hasAudio: !!audioBase64 }, "SendMessage: ElevenLabs result");

  // ── 5. Persist AI message ──
  const aiMsgId = randomUUID();
  const now = new Date();
  await db.insert(messagesTable).values({
    id: aiMsgId,
    userId: req.user.id,
    characterSlug,
    role: "assistant",
    content: aiContent,
    createdAt: now,
  });

  req.log.info({ aiMsgId }, "SendMessage: AI message saved — responding");

  res.json(
    SendMessageResponse.parse({
      id: aiMsgId,
      characterSlug,
      role: "assistant",
      content: aiContent,
      createdAt: now,
      audio: audioBase64,
    }),
  );
});

// DELETE /api/chat/:characterSlug/messages/clear — wipe history
router.delete("/chat/:characterSlug/messages/clear", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { characterSlug } = req.params;

  await db
    .delete(messagesTable)
    .where(
      and(
        eq(messagesTable.userId, req.user.id),
        eq(messagesTable.characterSlug, characterSlug),
      ),
    );

  res.json(ClearChatHistoryResponse.parse({ success: true }));
});

// ─── Voice Health Check ───────────────────────────────────────────────────────

router.get("/voice/health", async (req: Request, res: Response) => {
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.VOICE_API_KEY;
  const voiceId = process.env.VOICE_ID;

  if (!apiKey || !voiceId) {
    res.json({
      ok: false,
      reason: !apiKey ? "missing API key (ELEVENLABS_API_KEY or VOICE_API_KEY)" : "missing VOICE_ID",
      hasElevenLabsKey: !!process.env.ELEVENLABS_API_KEY,
      hasVoiceApiKey: !!process.env.VOICE_API_KEY,
      hasVoiceId: !!voiceId,
    });
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const testRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: "Hello",
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    clearTimeout(timeoutId);

    if (!testRes.ok) {
      const body = await testRes.text().catch(() => "(unreadable)");
      res.json({
        ok: false,
        httpStatus: testRes.status,
        error: body,
        usingKey: process.env.ELEVENLABS_API_KEY ? "ELEVENLABS_API_KEY" : "VOICE_API_KEY",
        voiceId,
      });
      return;
    }

    const buf = await testRes.arrayBuffer();
    res.json({
      ok: true,
      audioBytes: buf.byteLength,
      usingKey: process.env.ELEVENLABS_API_KEY ? "ELEVENLABS_API_KEY" : "VOICE_API_KEY",
      voiceId,
    });

  } catch (err) {
    clearTimeout(timeoutId);
    res.json({ ok: false, error: String(err) });
  }
});

export default router;
