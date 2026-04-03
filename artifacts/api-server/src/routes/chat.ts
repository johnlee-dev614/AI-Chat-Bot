import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { db, messagesTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import {
  GetChatHistoryResponse,
  SendMessageBody,
  SendMessageResponse,
  ClearChatHistoryResponse,
} from "@workspace/api-zod";
import { getCharacterBySlug } from "../config/characters";

const router: IRouter = Router();

// ─── Shared logger type ──────────────────────────────────────────────────────

type PinoLog = {
  info: (o: object, msg: string) => void;
  warn: (o: object, msg: string) => void;
  error: (o: object, msg: string) => void;
};

// ─── OpenRouter ───────────────────────────────────────────────────────────────
//
// Model priority: fastest/most-reliable first.
// Each fetch gets its own AbortController with a hard 12-second timeout so one
// slow/hung model never blocks the whole request.

const OPENROUTER_MODELS = [
  "openrouter/free",           // auto-routes to best available; confirmed working
  "google/gemma-3-4b-it:free", // confirmed working direct fallback
  "google/gemma-3-12b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

const OPENROUTER_MODEL_TIMEOUT_MS = 12_000; // 12 s per model attempt

async function callOpenRouter(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  log: PinoLog,
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

  for (const model of OPENROUTER_MODELS) {
    log.info({ model }, "OpenRouter: trying model");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_MODEL_TIMEOUT_MS);

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({ model, messages, temperature: 0.95, max_tokens: 150 }),
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

      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        log.warn(
          { model, raw: rawText.slice(0, 300) },
          "OpenRouter: empty content, trying next model",
        );
        errors.push(`${model} → empty content`);
        continue;
      }

      log.info({ model, replyLen: content.length }, "OpenRouter: success");
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

  throw new Error(`All OpenRouter models failed — ${errors.join(" | ")}`);
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

  // ── 2. Load conversation history (last 12 messages for context) ──
  const history = await db
    .select()
    .from(messagesTable)
    .where(
      and(
        eq(messagesTable.userId, req.user.id),
        eq(messagesTable.characterSlug, characterSlug),
      ),
    )
    .orderBy(asc(messagesTable.createdAt))
    .limit(12);

  req.log.info({ historyCount: history.length }, "SendMessage: history loaded");

  // ── 3. Generate AI text reply (OpenRouter) ──
  let aiContent: string;
  try {
    aiContent = await callOpenRouter(character.systemPrompt, history, req.log);
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
