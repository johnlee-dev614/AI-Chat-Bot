import { Router, type IRouter, type Request, type Response } from "express";
import {
  ListCharactersResponse,
  GetCharacterResponse,
} from "@workspace/api-zod";
import { characters, getCharacterBySlug } from "../config/characters";

const router: IRouter = Router();

router.get("/characters", (req: Request, res: Response) => {
  const { search, tag, category } = req.query;

  let filtered = [...characters];

  if (typeof search === "string" && search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (typeof tag === "string" && tag.trim()) {
    filtered = filtered.filter((c) => c.tags.includes(tag));
  }

  if (typeof category === "string" && category.trim()) {
    filtered = filtered.filter((c) => c.category === category);
  }

  res.json(ListCharactersResponse.parse({ characters: filtered }));
});

router.get("/characters/:slug", (req: Request, res: Response) => {
  const character = getCharacterBySlug(req.params.slug);
  if (!character) {
    res.status(404).json({ error: "Character not found" });
    return;
  }
  res.json(GetCharacterResponse.parse(character));
});

export default router;
