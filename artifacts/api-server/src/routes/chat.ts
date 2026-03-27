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
        eq(messagesTable.characterSlug, characterSlug)
      )
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

  // Get conversation history for context
  const history = await db
    .select()
    .from(messagesTable)
    .where(
      and(
        eq(messagesTable.userId, req.user.id),
        eq(messagesTable.characterSlug, characterSlug)
      )
    )
    .orderBy(asc(messagesTable.createdAt))
    .limit(20);

  // Generate AI response (mock for now — swap provider here)
  const aiContent = await generateAIResponse(character.systemPrompt, history, content);

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
    createdAt: now.toISOString(),
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
        eq(messagesTable.characterSlug, characterSlug)
      )
    );

  res.json(ClearChatHistoryResponse.parse({ success: true }));
});

// AI response generation — mock implementation
// Replace this function body to swap providers (OpenAI, Anthropic, etc.)
async function generateAIResponse(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  userMessage: string
): Promise<string> {
  // Check for content moderation flags
  const blockedTerms = ["illegal", "harm", "violence"];
  const lowerMsg = userMessage.toLowerCase();
  if (blockedTerms.some((term) => lowerMsg.includes(term))) {
    return "I'd rather we talk about something else. What else is on your mind?";
  }

  // TODO: Replace with real AI provider
  // Example OpenAI integration:
  // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4o",
  //   messages: [
  //     { role: "system", content: systemPrompt },
  //     ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
  //     { role: "user", content: userMessage }
  //   ],
  //   max_tokens: 300,
  // });
  // return response.choices[0].message.content ?? "...";

  // Mock responses for MVP
  const mockResponses = [
    "That's a fascinating thought... Tell me more about what you mean by that.",
    "I've been thinking about something similar recently. It's funny how the universe works sometimes.",
    "You know, most people never think to ask that. I like the way your mind works.",
    "Hmm, let me sit with that for a moment... I think what you're really asking is something deeper.",
    "Every time we talk, you surprise me. I mean that genuinely.",
    "There's something about the way you said that... it really resonates with me.",
  ];

  const idx = Math.floor(Math.random() * mockResponses.length);
  return mockResponses[idx];
}

export default router;
