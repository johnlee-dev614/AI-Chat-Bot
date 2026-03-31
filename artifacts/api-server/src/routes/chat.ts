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

type PinoLog = { info: (o: object, msg: string) => void; warn: (o: object, msg: string) => void; error: (o: object, msg: string) => void };

// ─── OpenRouter (Llama 3) ────────────────────────────────────────────────────

// Working models first, then others as fallback when they recover from rate limits
const OPENROUTER_MODELS = [
  "openrouter/free",                            // OpenRouter auto-routes to best available free model
  "google/gemma-3-4b-it:free",                 // Confirmed working
  "google/gemma-3-12b-it:free",
  "google/gemma-3-27b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
];

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

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify({ model, messages, temperature: 0.95, max_tokens: 120 }),
      });

      const rawText = await res.text();

      // Non-2xx → skip to next model
      if (!res.ok) {
        log.warn({ model, status: res.status, body: rawText.slice(0, 200) }, "OpenRouter: model failed, trying next");
        errors.push(`${model} → HTTP ${res.status}`);
        continue;
      }

      const data = JSON.parse(rawText) as {
        choices?: Array<{ message?: { content?: string } }>;
        error?: { message: string; code?: number };
      };

      // 200 but error body (e.g. rate-limit wrapped in 200) → skip
      if (data.error) {
        log.warn({ model, errCode: data.error.code, errMsg: data.error.message }, "OpenRouter: model error body, trying next");
        errors.push(`${model} → ${data.error.message}`);
        continue;
      }

      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        log.warn({ model, raw: rawText.slice(0, 200) }, "OpenRouter: empty content, trying next");
        errors.push(`${model} → empty content`);
        continue;
      }

      log.info({ model }, "OpenRouter: success");
      return content;

    } catch (err) {
      log.warn({ model, err }, "OpenRouter: fetch threw, trying next");
      errors.push(`${model} → ${String(err)}`);
    }
  }

  throw new Error(`All OpenRouter models failed: ${errors.join(" | ")}`);
}

// ─── ElevenLabs TTS ──────────────────────────────────────────────────────────

async function callElevenLabs(text: string, log: PinoLog): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.VOICE_API_KEY;
  const voiceId = process.env.VOICE_ID;

  if (!apiKey) {
    log.warn({ keysChecked: ["ELEVENLABS_API_KEY", "VOICE_API_KEY"] }, "ElevenLabs: no API key found");
    return null;
  }
  if (!voiceId) {
    log.warn({}, "ElevenLabs: VOICE_ID env var not set");
    return null;
  }

  const usingKey = process.env.ELEVENLABS_API_KEY ? "ELEVENLABS_API_KEY" : "VOICE_API_KEY";
  log.info({ voiceId, usingKey }, "ElevenLabs: sending TTS request");

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: { stability: 0.3, similarity_boost: 0.85 },
        }),
      },
    );

    if (!res.ok) {
      const errBody = await res.text().catch(() => "(unreadable)");
      log.error({ status: res.status, body: errBody }, "ElevenLabs: HTTP error");
      return null;
    }

    const audioBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString("base64");
    log.info({ base64Len: base64.length }, "ElevenLabs: audio generated");
    return base64;
  } catch (err) {
    log.error({ err }, "ElevenLabs: request threw");
    return null;
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

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
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { content } = parsed.data;

  // Save user message
  const userMsgId = randomUUID();
  await db.insert(messagesTable).values({
    id: userMsgId,
    userId: req.user.id,
    characterSlug,
    role: "user",
    content,
    createdAt: new Date(),
  });

  // Get last 10 messages for context (excluding the one we just saved)
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
    .limit(10);

  // Generate AI reply via OpenRouter
  let aiContent: string;
  try {
    aiContent = await callOpenRouter(character.systemPrompt, history, req.log);
  } catch (err) {
    req.log.error({ err }, "OpenRouter error");
    res.status(502).json({ error: "AI service unavailable. Please try again." });
    return;
  }

  // Generate voice via ElevenLabs (non-fatal if it fails)
  const audioBase64 = await callElevenLabs(aiContent, req.log);
  req.log.info({ hasAudio: !!audioBase64 }, "ElevenLabs result");

  // Save AI message
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

  const aiMessage = {
    id: aiMsgId,
    characterSlug,
    role: "assistant" as const,
    content: aiContent,
    createdAt: now,   // Date object — Zod schema uses useDates:true, stringify handles serialization
    audio: audioBase64,
  };

  res.json(SendMessageResponse.parse(aiMessage));
});

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

// ─── Voice Health Check (debug) ─────────────────────────────────────────────
// GET /api/voice/health — tests ElevenLabs connectivity and returns status JSON

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

  try {
    const testRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: "test",
          model_id: "eleven_turbo_v2_5",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      },
    );

    if (!testRes.ok) {
      const body = await testRes.text().catch(() => "(unreadable)");
      req.log.error({ status: testRes.status, body }, "ElevenLabs health check failed");
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
    res.json({ ok: false, error: String(err) });
  }
});

export default router;
