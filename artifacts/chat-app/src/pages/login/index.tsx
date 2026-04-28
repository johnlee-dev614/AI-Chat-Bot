import { useState, useEffect, type FormEvent } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Mail, CheckCircle } from "lucide-react";

type Tab = "login" | "signup";

const FAILED_LOGIN_THRESHOLD = 7;

function getReturnTo(): string {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("returnTo") ?? "";
  // Only allow same-origin relative paths
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/characters";
}

export function Login() {
  const { isAuthenticated, refetchUser } = useAuth();
  const [location, setLocation] = useLocation();

  const [tab, setTab] = useState<Tab>(() => (window.location.pathname.endsWith("/signup") ? "signup" : "login"));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Failed login attempt tracking
  const [failedAttempts, setFailedAttempts] = useState(0);
  const showResetPrompt = failedAttempts >= FAILED_LOGIN_THRESHOLD;

  // Forgot-password / request-reset panel state
  const [showForgotPanel, setShowForgotPanel] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetDevUrl, setResetDevUrl] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupDisplayName, setSignupDisplayName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [confirmedTerms, setConfirmedTerms] = useState(false);
  const [confirmedAge, setConfirmedAge] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation(getReturnTo());
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    if (location === "/signup") {
      setTab("signup");
      setError(null);
    }
  }, [location]);

  function switchTab(t: Tab) {
    setTab(t);
    setError(null);
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError("Please fill in all fields.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        const newFails = failedAttempts + 1;
        setFailedAttempts(newFails);
        // Pre-fill reset email with the email the user is trying
        if (!resetEmail) setResetEmail(loginEmail);
        setError(data.error ?? "Login failed. Please try again.");
        return;
      }
      refetchUser();
      setLocation(getReturnTo());
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRequestReset(e: FormEvent) {
    e.preventDefault();
    if (!resetEmail) { setResetError("Please enter your email address."); return; }
    setResetSubmitting(true);
    setResetError(null);
    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = (await res.json()) as { resetUrl?: string; error?: string };
      if (!res.ok) { setResetError(data.error ?? "Something went wrong."); return; }
      setResetSent(true);
      if (data.resetUrl) setResetDevUrl(data.resetUrl);
    } catch {
      setResetError("Network error. Please try again.");
    } finally {
      setResetSubmitting(false);
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    if (!signupDisplayName || !signupEmail || !signupPassword || !signupConfirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (signupPassword !== signupConfirm) {
      setError("Passwords do not match.");
      return;
    }
    if (signupPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!acceptedTerms || !confirmedTerms || !confirmedAge) {
      setError("Please check all required boxes before creating your account.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          displayName: signupDisplayName,
          acceptedTerms,
          confirmedTerms,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Sign up failed. Please try again.");
        return;
      }
      refetchUser();
      setLocation(getReturnTo());
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-mesh">
      {/* Ambient bedroom glows */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-primary/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-accent/8 blur-[120px] rounded-full" />
      </div>

      <div className="glass-panel p-8 sm:p-10 rounded-3xl max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.png"
            alt="Sonuria"
            className="w-14 h-14 rounded-2xl object-cover shadow-[0_0_30px_-6px_hsl(var(--primary)/0.5)] mb-5"
          />
          <h1 className="font-display text-3xl font-semibold italic text-white/90">
            {tab === "login" ? "Welcome back" : "Join Sonuria"}
          </h1>
          <p className="text-muted-foreground/60 font-light text-sm mt-2 text-center">
            {tab === "login"
              ? "Sign in to continue your conversations."
              : "Create an account to save companions and chat history."}
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-xl bg-white/[0.04] border border-white/[0.06] p-1 mb-7">
          {(["login", "signup"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className={cn(
                "flex-1 text-sm py-2 rounded-lg font-light tracking-wide transition-all duration-200",
                tab === t
                  ? "bg-primary/80 text-white shadow-sm"
                  : "text-muted-foreground hover:text-white/70"
              )}
            >
              {t === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-light">
            {error}
          </div>
        )}

        {/* Login form */}
        {tab === "login" && !showForgotPanel && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground/60 font-light mb-1.5 tracking-wide uppercase">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-muted-foreground/30 font-light focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground/60 font-light mb-1.5 tracking-wide uppercase">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-muted-foreground/30 font-light focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all duration-200"
              />
            </div>

            {/* Forgot password link (always visible) */}
            <div className="flex justify-end -mt-1">
              <button
                type="button"
                onClick={() => { setShowForgotPanel(true); setError(null); if (loginEmail) setResetEmail(loginEmail); }}
                className="text-xs text-primary/60 hover:text-primary/90 transition-colors font-light"
              >
                Forgot password?
              </button>
            </div>

            {/* Reset prompt banner after 7 failed attempts */}
            <AnimatePresence>
              {showResetPrompt && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/25 text-sm font-light"
                >
                  <KeyRound className="w-4 h-4 text-primary/70 shrink-0 mt-0.5" />
                  <span className="text-white/75">
                    Having trouble signing in?{" "}
                    <button
                      type="button"
                      onClick={() => { setShowForgotPanel(true); setError(null); }}
                      className="underline underline-offset-2 text-primary/80 hover:text-primary transition-colors"
                    >
                      Reset your password
                    </button>{" "}
                    to get back in.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              variant="glow"
              size="lg"
              disabled={isSubmitting}
              className="w-full h-12 font-light tracking-wide rounded-2xl mt-2"
            >
              {isSubmitting ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        )}

        {/* Forgot Password / Request Reset panel */}
        {tab === "login" && showForgotPanel && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {resetSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-primary/80" />
                </div>
                <h3 className="font-display text-lg font-semibold italic text-white/90 mb-2">Check your inbox</h3>
                <p className="text-sm text-muted-foreground/60 font-light leading-relaxed">
                  If an account with that email exists, we've sent a reset link — good for 1 hour.
                </p>
                {resetDevUrl && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
                    <p className="text-xs text-amber-300/80 font-light mb-1">Dev mode — SMTP not configured. Use this link:</p>
                    <a
                      href={resetDevUrl}
                      className="text-xs text-primary/80 underline underline-offset-2 break-all"
                    >
                      {resetDevUrl}
                    </a>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowForgotPanel(false); setResetSent(false); setResetDevUrl(null); }}
                  className="mt-5 text-muted-foreground/60 hover:text-white/70 font-light"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-primary/60" />
                  <h3 className="font-display text-base font-semibold italic text-white/80">Reset your password</h3>
                </div>
                <p className="text-xs text-muted-foreground/55 font-light leading-relaxed">
                  Enter the email linked to your account and we'll send a reset link.
                </p>
                {resetError && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-light">
                    {resetError}
                  </div>
                )}
                <div>
                  <label className="block text-xs text-muted-foreground/60 font-light mb-1.5 tracking-wide uppercase">Email</label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-muted-foreground/30 font-light focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all duration-200"
                  />
                </div>
                <Button
                  type="submit"
                  variant="glow"
                  size="lg"
                  disabled={resetSubmitting}
                  className="w-full h-11 font-light tracking-wide rounded-2xl"
                >
                  {resetSubmitting ? "Sending…" : "Send Reset Link"}
                </Button>
                <button
                  type="button"
                  onClick={() => { setShowForgotPanel(false); setResetError(null); }}
                  className="w-full text-xs text-muted-foreground/50 hover:text-white/60 transition-colors py-1 font-light"
                >
                  Cancel — back to Sign In
                </button>
              </form>
            )}
          </motion.div>
        )}

        {/* Signup form */}
        {tab === "signup" && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground/60 font-light mb-1.5 tracking-wide uppercase">
                Display Name
              </label>
              <input
                type="text"
                autoComplete="name"
                value={signupDisplayName}
                onChange={(e) => setSignupDisplayName(e.target.value)}
                placeholder="How should we call you?"
                maxLength={100}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-muted-foreground/30 font-light focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground/60 font-light mb-1.5 tracking-wide uppercase">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-muted-foreground/30 font-light focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground/60 font-light mb-1.5 tracking-wide uppercase">
                Password
                <span className="normal-case ml-1 text-muted-foreground/40">(min 8 chars)</span>
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-muted-foreground/30 font-light focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground/60 font-light mb-1.5 tracking-wide uppercase">
                Confirm Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={signupConfirm}
                onChange={(e) => setSignupConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-muted-foreground/30 font-light focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all duration-200"
              />
            </div>
            <div className="space-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <label className="flex items-start gap-3 text-sm text-muted-foreground/70 font-light leading-relaxed">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-white/[0.04] accent-primary"
                />
                <span>
                  I have read and accept Sonuria's{" "}
                  <a href="/terms" className="text-primary/80 underline underline-offset-2 hover:text-primary transition-colors">
                    Terms of Service
                  </a>
                  .
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm text-muted-foreground/70 font-light leading-relaxed">
                <input
                  type="checkbox"
                  checked={confirmedTerms}
                  onChange={(e) => setConfirmedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-white/[0.04] accent-primary"
                />
                <span>
                  I have read and agree to Sonuria's{" "}
                  <a href="/privacy" className="text-primary/80 underline underline-offset-2 hover:text-primary transition-colors">
                    Privacy Policy
                  </a>
                  {" "}and{" "}
                  <a href="/aup" className="text-primary/80 underline underline-offset-2 hover:text-primary transition-colors">
                    Acceptable Use Policy
                  </a>
                  .
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm text-muted-foreground/70 font-light leading-relaxed">
                <input
                  type="checkbox"
                  checked={confirmedAge}
                  onChange={(e) => setConfirmedAge(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-white/[0.04] accent-primary"
                />
                <span>
                  I confirm that I am at least <strong className="text-white/70 font-medium">18 years of age</strong> or older.
                </span>
              </label>
            </div>
            <Button
              type="submit"
              variant="glow"
              size="lg"
              disabled={isSubmitting || !acceptedTerms || !confirmedTerms || !confirmedAge}
              className="w-full h-12 font-light tracking-wide rounded-2xl mt-2"
            >
              {isSubmitting ? "Creating account…" : "Create Account"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
