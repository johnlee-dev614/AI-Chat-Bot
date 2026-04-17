import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { db, messagesTable, usersTable, emberTransactionsTable } from "@workspace/db";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import {
  GetChatHistoryResponse,
  SendMessageBody,
  SendMessageResponse,
  ClearChatHistoryResponse,
} from "@workspace/api-zod";
import { getCharacterBySlug, CharacterConfig } from "../config/characters";

const router: IRouter = Router();

// ─── Ember cost table ─────────────────────────────────────────────────────────
export const EMBER_COSTS = {
  text:       10,  // standard text message
  deepMemory: 15,  // deep memory mode (replaces text cost, not additive)
  voice:      50,  // voice audio generation (additive on top of text/deepMemory)
} as const;

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

// ── Thinking-leak helpers ────────────────────────────────────────────────────
// Patterns that indicate a model is "thinking out loud" — exposing its reasoning
// process instead of just replying as the character.
const THINKING_LEAK_PATTERNS = [
  // Reasoning starters
  /okay,?\s+the user (just )?(said|sent|wrote|asked)/i,
  /the user (just )?(said|sent|wrote|typed|messaged)/i,
  /user said\b/i,
  /now i need to respond/i,
  /i need to respond as/i,
  /i (should|will|need to|must) (respond|reply|engage|keep|make sure)/i,
  /let me (think|craft|write|reply|respond|formulate)/i,
  // Context/history review
  /looking at the (history|conversation|context)/i,
  /look at (the )?(history|conversation|context)/i,
  /she'?s been (playful|flirty|teasing|engaging)/i,
  /she('s| has) been\b/i,
  /based on (the |our )?(conversation|history|context)/i,
  // Instructions leaking back out
  /\b(isabella'?s?|character'?s?) (rules|style|persona|personality)\b/i,
  /must stay in character/i,
  /this is (explicit|flirty|sensitive|a roleplay)/i,
  /the (user|message) is (asking|saying|requesting)/i,
  /my response (should|will|needs to)/i,
  /so (my |the )?reply (should|will|is)/i,
  /\bshort,?\s+flirty\b/i,           // e.g. "short, flirty, teasing"
  /\bflirty,?\s+teasing\b/i,
  /\d[-–]\d\s+sentences?\b/i,        // e.g. "1-2 sentences"
  /\bteasing,?\s+\d/i,               // e.g. "teasing, 1-2 sentences"
  /respond(ing)? (with|in) (a |character)/i,
  /keep it (short|brief|playful)/i,
  /→\s*i (said|replied|responded)/i, // history recaps
  /user started with/i,
  /\bplay(ful|ing) hard to get\b/i,
  /something like[:\s]/i,            // "I'll say something like: …"
  /\bmy (reply|response|answer)\b/i,
  /<thinking>/i,
  /^\s*\*{1,3}[^*]+\*{1,3}\s*$/im,  // line that's only **bolded text** (meta-notes)
];

function isGenericReply(text: string): boolean {
  return GENERIC_ASSISTANT_PATTERNS.some((re) => re.test(text.trim()));
}

// A line is "safe" (looks like actual in-character reply) when it:
// - Is short enough to be a chat message
// - Contains no reasoning markers
// - Contains in-character cues OR has no meta-note cues
function isCleanReplyLine(line: string): boolean {
  if (line.length > 200) return false;
  if (line.length < 3) return false;
  if (/^[-•*]\s/.test(line)) return false; // list item
  if (/^\d+\.\s/.test(line)) return false; // numbered list
  if (THINKING_LEAK_PATTERNS.some((p) => p.test(line))) return false;
  if (GENERIC_ASSISTANT_PATTERNS.some((p) => p.test(line))) return false;
  return true;
}

// Detect chain-of-thought leakage. When found, try to salvage the actual reply.
// Returns null if we can't extract a clean reply — caller should skip this model.
function extractFromThinkingLeak(rawText: string): string | null {
  const hasLeak = THINKING_LEAK_PATTERNS.some((p) => p.test(rawText));
  if (!hasLeak) return rawText; // clean — return as-is

  // ① Look for an explicit "Isabella: <reply>" marker (model named its output)
  const namedMatch = rawText.match(/\bisabella\s*:\s*[""]?([^\n"]{4,160})[""]?\s*$/im);
  if (namedMatch) {
    const candidate = namedMatch[1].trim();
    if (isCleanReplyLine(candidate)) return candidate;
  }

  // ② Look for the last quoted string — models often quote the actual reply
  //    e.g.  I'll say: "wow, just 'hey'? 😏"
  const quotedMatches = [...rawText.matchAll(/[""]([^""]{4,160})[""]|\u201c([^\u201d]{4,160})\u201d/g)];
  if (quotedMatches.length > 0) {
    const last = quotedMatches[quotedMatches.length - 1];
    const candidate = (last[1] ?? last[2] ?? "").trim();
    if (isCleanReplyLine(candidate)) return candidate;
  }

  // ③ Fall back to last clean line (scanning bottom-up)
  const lines = rawText.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (isCleanReplyLine(lines[i])) return lines[i];
  }

  return null; // nothing salvageable — skip this model
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

  const { content, voice = false, deepMemory = false } = parsed.data;

  // ── Compute cost for this message ──
  const baseCost    = deepMemory ? EMBER_COSTS.deepMemory : EMBER_COSTS.text;
  const messageCost = voice ? baseCost + EMBER_COSTS.voice : baseCost;

  req.log.info(
    { characterSlug, userId: req.user.id, messageLen: content.length, voice, deepMemory, messageCost },
    "SendMessage: received",
  );

  // ── 0. Ember balance check ──
  const [balanceRow] = await db
    .select({ embers: usersTable.embers })
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id));

  if (!balanceRow || balanceRow.embers < messageCost) {
    req.log.warn({ userId: req.user.id, embers: balanceRow?.embers, required: messageCost }, "SendMessage: insufficient embers");
    res.status(402).json({
      error: "Insufficient Embers",
      code: "insufficient_embers",
      embers: balanceRow?.embers ?? 0,
      required: messageCost,
    });
    return;
  }

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

  // ── 4. Generate voice audio (ElevenLabs, non-fatal) — only when requested ──
  const audioBase64 = voice ? await callElevenLabs(aiContent, req.log) : null;
  req.log.info({ hasAudio: !!audioBase64 }, "SendMessage: ElevenLabs result");

  // ── 5. Deduct embers (atomic, floor at 0) ──
  const [updatedUser] = await db
    .update(usersTable)
    .set({ embers: sql`GREATEST(${usersTable.embers} - ${messageCost}, 0)` })
    .where(eq(usersTable.id, req.user.id))
    .returning({ embers: usersTable.embers });

  const modeLabel = [
    deepMemory ? "deep memory" : "text",
    voice ? "voice" : null,
  ].filter(Boolean).join(" + ");

  await db.insert(emberTransactionsTable).values({
    id: randomUUID(),
    userId: req.user.id,
    type: "debit",
    amount: messageCost,
    description: `Chat with ${characterSlug} · ${modeLabel}`,
  });

  const remainingEmbers = updatedUser?.embers ?? 0;
  req.log.info({ remainingEmbers }, "SendMessage: ember deducted");

  // ── 6. Persist AI message ──
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
      embers: remainingEmbers,
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
