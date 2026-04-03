import bcrypt from "bcryptjs";
import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod/v4";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetCurrentAuthUserResponse,
  SignupBody,
  SignupResponse,
  LoginBody,
  LoginResponse,
} from "@workspace/api-zod";
import {
  clearSession,
  createSession,
  getSessionId,
  deleteSession,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

const BCRYPT_ROUNDS = 12;

const router: IRouter = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

// ─── GET /auth/user ───────────────────────────────────────────────────────────

router.get("/auth/user", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

// ─── POST /auth/signup ────────────────────────────────────────────────────────

router.post("/auth/signup", async (req: Request, res: Response) => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    res.status(400).json({ error: firstError });
    return;
  }

  const { email, password, displayName } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Check for duplicate email
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));

  if (existing) {
    res.status(409).json({ error: "An account with that email already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const [user] = await db
    .insert(usersTable)
    .values({
      email: normalizedEmail,
      passwordHash,
      displayName: displayName.trim(),
    })
    .returning();

  const sessionData: SessionData = {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    },
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);

  res.json(
    SignupResponse.parse({
      user: sessionData.user,
    }),
  );
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

router.post("/auth/login", async (req: Request, res: Response) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    res.status(400).json({ error: firstError });
    return;
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const sessionData: SessionData = {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    },
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);

  res.json(
    LoginResponse.parse({
      user: sessionData.user,
    }),
  );
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────

router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  if (sid) {
    await deleteSession(sid);
  }
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.json({ success: true });
});

export default router;
