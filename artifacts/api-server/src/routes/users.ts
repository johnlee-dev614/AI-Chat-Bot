import { Router, type IRouter, type Request, type Response } from "express";
import { db, favoritesTable, messagesTable } from "@workspace/db";
import { eq, and, countDistinct } from "drizzle-orm";
import {
  GetFavoritesResponse,
  AddFavoriteResponse,
  RemoveFavoriteResponse,
  GetAccountResponse,
} from "@workspace/api-zod";

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
