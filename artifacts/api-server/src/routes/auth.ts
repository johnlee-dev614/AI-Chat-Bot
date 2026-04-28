import bcrypt from "bcryptjs";
import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod/v4";
import { db, usersTable, emberTransactionsTable, passwordResetTokensTable } from "@workspace/db";
import { eq, and, gt, isNull } from "drizzle-orm";
import { randomUUID, createHash, randomBytes } from "crypto";
import nodemailer from "nodemailer";

import {
  GetCurrentAuthUserResponse,
  SignupBody,
  SignupResponse,
  LoginBody,
  LoginResponse,
  RequestPasswordResetBody,
  RequestPasswordResetResponse,
  ResetPasswordBody,
  ResetPasswordResponse,
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
const STARTER_PACK_EMBERS = 50;

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

  const { email, password, displayName, acceptedTerms, confirmedTerms } = parsed.data;
  if (!acceptedTerms || !confirmedTerms) {
    res.status(400).json({ error: "You must accept the Terms of Service to create an account." });
    return;
  }

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
      embers: STARTER_PACK_EMBERS,
      trialUsed: true,
    })
    .returning();

  // Log the starter pack grant
  await db.insert(emberTransactionsTable).values({
    id: randomUUID(),
    userId: user.id,
    type: "credit",
    amount: STARTER_PACK_EMBERS,
    description: "The Spark starter pack",
  });

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

// ─── POST /auth/request-reset ─────────────────────────────────────────────────
// Generates a password reset token and emails it to the user.
// Always returns 200 (to avoid email enumeration).

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function buildResetUrl(token: string): string {
  const base = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : "http://localhost:5173";
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
}

async function sendResetEmail(
  toEmail: string,
  resetUrl: string,
): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? "info@sonuria.com";

  if (!host || !user || !pass) return false; // SMTP not configured

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"Sonuria" <${from}>`,
    to: toEmail,
    subject: "Reset your Sonuria password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0d0d18;color:#e5e7eb;border-radius:16px;">
        <h2 style="font-size:22px;margin-bottom:8px;color:#fff;">Password Reset</h2>
        <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin-bottom:24px;">
          We received a request to reset the password for your Sonuria account.
          Click the button below — the link expires in <strong style="color:#e5e7eb;">1 hour</strong>.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:500;padding:12px 28px;border-radius:12px;text-decoration:none;">
          Reset Password
        </a>
        <p style="color:#6b7280;font-size:12px;margin-top:28px;line-height:1.5;">
          If you didn't request this, you can safely ignore this email.<br/>
          © ${new Date().getFullYear()} Sonuria, Inc.
        </p>
      </div>
    `,
  });

  return true;
}

router.post("/auth/request-reset", async (req: Request, res: Response) => {
  const parsed = RequestPasswordResetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please provide a valid email address." });
    return;
  }

  const email = parsed.data.email.toLowerCase().trim();

  // Always respond the same way — don't leak whether the email exists
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!user) {
    res.json(RequestPasswordResetResponse.parse({
      success: true,
      message: "If that email is registered, a reset link has been sent.",
    }));
    return;
  }

  // Invalidate old tokens for this email by allowing new one (unique token_hash handles it)
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await db.insert(passwordResetTokensTable).values({
    email,
    tokenHash,
    expiresAt,
  });

  const resetUrl = buildResetUrl(rawToken);
  const emailSent = await sendResetEmail(email, resetUrl).catch(() => false);

  res.json(
    RequestPasswordResetResponse.parse({
      success: true,
      message: "If that email is registered, a reset link has been sent.",
      // Surface the URL when SMTP is not configured so the link still works
      ...(emailSent ? {} : { resetUrl }),
    }),
  );
});

// ─── POST /auth/reset-password ────────────────────────────────────────────────

router.post("/auth/reset-password", async (req: Request, res: Response) => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request." });
    return;
  }

  const { token, password } = parsed.data;
  const tokenHash = hashToken(token);

  const [row] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.tokenHash, tokenHash),
        isNull(passwordResetTokensTable.usedAt),
        gt(passwordResetTokensTable.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row) {
    res.status(400).json({ error: "This reset link is invalid or has expired. Please request a new one." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Update password and mark token as used atomically
  await Promise.all([
    db
      .update(usersTable)
      .set({ passwordHash })
      .where(eq(usersTable.email, row.email)),
    db
      .update(passwordResetTokensTable)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokensTable.id, row.id)),
  ]);

  res.json(ResetPasswordResponse.parse({ success: true, message: "Password updated. You can now sign in." }));
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
