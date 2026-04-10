import { Router, type IRouter, type Request, type Response } from "express";
import { db, favoritesTable, messagesTable, usersTable, emberTransactionsTable } from "@workspace/db";
import { eq, and, countDistinct } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  GetFavoritesResponse,
  AddFavoriteResponse,
  RemoveFavoriteResponse,
  GetAccountResponse,
  GetBalanceResponse,
  ClaimStarterResponse,
} from "@workspace/api-zod";

const STARTER_PACK_EMBERS = 10;

const router: IRouter = Router();

router.get("/users/favorites", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rows = await db
    .select()
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, req.user.id));

  const favorites = rows.map((r) => r.characterSlug);
  res.json(GetFavoritesResponse.parse({ favorites }));
});

router.post("/users/favorites/:characterSlug", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { characterSlug } = req.params;

  await db
    .insert(favoritesTable)
    .values({ userId: req.user.id, characterSlug })
    .onConflictDoNothing();

  res.json(AddFavoriteResponse.parse({ success: true }));
});

router.delete("/users/favorites/:characterSlug", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { characterSlug } = req.params;

  await db
    .delete(favoritesTable)
    .where(
      and(
        eq(favoritesTable.userId, req.user.id),
        eq(favoritesTable.characterSlug, characterSlug)
      )
    );

  res.json(RemoveFavoriteResponse.parse({ success: true }));
});

// ── GET /api/users/balance ────────────────────────────────────────────────────
router.get("/users/balance", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db
    .select({ embers: usersTable.embers, trialUsed: usersTable.trialUsed })
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetBalanceResponse.parse({ embers: user.embers, trialUsed: user.trialUsed }));
});

// ── POST /api/users/claim-starter ─────────────────────────────────────────────
// Grants "The Spark" starter pack (10 Embers) once per account.
router.post("/users/claim-starter", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db
    .select({ embers: usersTable.embers, trialUsed: usersTable.trialUsed })
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.trialUsed) {
    res.json(
      ClaimStarterResponse.parse({
        embers: user.embers,
        granted: false,
        message: "Starter pack already claimed.",
      }),
    );
    return;
  }

  const newEmbers = user.embers + STARTER_PACK_EMBERS;

  await db
    .update(usersTable)
    .set({ embers: newEmbers, trialUsed: true })
    .where(eq(usersTable.id, req.user.id));

  await db.insert(emberTransactionsTable).values({
    id: randomUUID(),
    userId: req.user.id,
    type: "credit",
    amount: STARTER_PACK_EMBERS,
    description: "The Spark starter pack",
  });

  res.json(
    ClaimStarterResponse.parse({
      embers: newEmbers,
      granted: true,
      message: `Welcome! ${STARTER_PACK_EMBERS} Embers added to your account.`,
    }),
  );
});

// ── GET /api/users/account ────────────────────────────────────────────────────
router.get("/users/account", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const favRows = await db
    .select()
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, req.user.id));

  const favorites = favRows.map((r) => r.characterSlug);

  const [countRow] = await db
    .select({ count: countDistinct(messagesTable.characterSlug) })
    .from(messagesTable)
    .where(eq(messagesTable.userId, req.user.id));

  const totalChats = countRow?.count ?? 0;

  res.json(
    GetAccountResponse.parse({
      user: req.user,
      favorites,
      totalChats,
    })
  );
});

export default router;
