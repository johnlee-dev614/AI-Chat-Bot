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

// ─── OpenRouter (Llama 3) ────────────────────────────────────────────────────

async function callOpenRouter(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : "https://localhost",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3-8b-instruct",
      messages,
      temperature: 0.95,
      max_tokens: 120,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message: string };
  };

  if (!data.choices?.[0]?.message?.content) {
    throw new Error(data.error?.message ?? "No content in OpenRouter response");
  }

  return data.choices[0].message.content.trim();
}

// ─── ElevenLabs TTS ──────────────────────────────────────────────────────────

async function callElevenLabs(text: string): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.VOICE_ID;

  if (!apiKey || !voiceId) {
    return null; // Voice not configured — silently skip
  }

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
          model_id: "eleven_monolingual_v1",
          voice_settings: { stability: 0.3, similarity_boost: 0.85 },
        }),
      },
    );

    if (!res.ok) return null;

    const audioBuffer = await res.arrayBuffer();
    return Buffer.from(audioBuffer).toString("base64");
  } catch {
    return null; // ElevenLabs failure is non-fatal
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
    aiContent = await callOpenRouter(character.systemPrompt, history);
  } catch (err) {
    req.log.error({ err }, "OpenRouter error");
    res.status(502).json({ error: "AI service unavailable. Please try again." });
    return;
  }

  // Generate voice via ElevenLabs (non-fatal if it fails)
  const audioBase64 = await callElevenLabs(aiContent);

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

export default router;
