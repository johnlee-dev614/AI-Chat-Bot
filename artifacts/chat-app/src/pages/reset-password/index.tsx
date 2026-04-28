import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { KeyRound, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResetPassword() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password || !confirm) { setError("Please fill in both fields."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (!token) { setError("Invalid reset link. Please request a new one."); return; }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? "Reset failed. Please try again.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-mesh">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-primary/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-accent/8 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="glass-panel p-8 sm:p-10 rounded-3xl max-w-md w-full relative z-10"
      >
        {success ? (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-14 h-14 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-5"
            >
              <CheckCircle className="w-7 h-7 text-primary/80" />
            </motion.div>
            <h2 className="font-display text-2xl font-semibold italic text-white/90 mb-2">Password updated</h2>
            <p className="text-sm text-muted-foreground/65 font-light mb-7">
              Your password has been changed. You can now sign in with your new password.
            </p>
            <Button
              variant="glow"
              className="w-full font-light tracking-wide rounded-2xl"
              onClick={() => navigate("/login")}
            >
              Go to Sign In
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/20 flex items-center justify-center mb-5">
                <KeyRound className="w-6 h-6 text-primary/70" />
              </div>
              <h1 className="font-display text-3xl font-semibold italic text-white/90">New password</h1>
              <p className="text-muted-foreground/60 font-light text-sm mt-2 text-center">
                Choose a strong password for your account.
              </p>
            </div>

            {!token && (
              <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-light">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>This reset link is missing or invalid. Please request a new one from the sign-in page.</span>
              </div>
            )}

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-light">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground/60 font-light mb-1.5 tracking-wide uppercase">
                  New Password <span className="normal-case text-muted-foreground/40">(min 8 chars)</span>
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-muted-foreground/30 font-light focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all duration-200"
                />
              </div>
              <Button
                type="submit"
                variant="glow"
                size="lg"
                disabled={submitting || !token}
                className="w-full h-12 font-light tracking-wide rounded-2xl mt-2"
              >
                {submitting ? "Updating…" : "Set New Password"}
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
