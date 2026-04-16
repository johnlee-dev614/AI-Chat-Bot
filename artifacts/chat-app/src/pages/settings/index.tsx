import { useState, useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetUserProfile, useUpdateProfile, useGetTransactions } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { User, AtSign, Flame, CheckCircle, AlertCircle, ChevronRight, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

function InputField({
  label, icon: Icon, value, onChange, placeholder, hint, error,
}: {
  label: string; icon: React.ElementType; value: string;
  onChange: (v: string) => void; placeholder?: string; hint?: string; error?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] text-white/40 uppercase tracking-widest font-light mb-2">
        {label}
      </label>
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border transition-all",
        error ? "border-rose-500/40" : "border-white/[0.07] focus-within:border-primary/40"
      )}>
        <Icon className="w-4 h-4 text-white/30 shrink-0" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/20 outline-none font-light"
        />
      </div>
      {error && <p className="mt-1.5 text-[11px] text-rose-400">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-[11px] text-white/25">{hint}</p>}
    </div>
  );
}

export function Settings() {
  const { isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useGetUserProfile({
    query: { enabled: isAuthenticated },
  });
  const { data: txData } = useGetTransactions({
    query: { enabled: isAuthenticated },
  });

  const updateMutation = useUpdateProfile();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string; username?: string; general?: string }>({});

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setUsername(profile.username ?? "");
    }
  }, [profile]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-0 flex flex-col items-center justify-center gap-6">
        <p className="text-muted-foreground font-light italic">Sign in to manage your settings.</p>
        <Button variant="glow" onClick={login}>Sign In</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-0 flex items-center justify-center">
        <div className="flex gap-1">
          {[0, 0.18, 0.36].map((d, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: `${d}s` }} />
          ))}
        </div>
      </div>
    );
  }

  function validate() {
    const errs: typeof errors = {};
    if (!displayName.trim()) errs.displayName = "Display name is required";
    if (username && !/^[a-zA-Z0-9_]{3,50}$/.test(username))
      errs.username = "3–50 characters, letters, numbers, and underscores only";
    return errs;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    try {
      await updateMutation.mutateAsync({ data: { displayName: displayName.trim(), username: username.trim() || undefined } });
      queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message || "Something went wrong";
      setErrors({ general: msg.includes("taken") ? "That username is already taken" : msg });
    }
  }

  const transactions = txData?.transactions ?? [];
  const latestPurchase = transactions.find((t) => t.type === "credit");

  return (
    <div className="min-h-screen pt-0 pb-20 bg-mesh">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/7 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-primary/80" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-semibold text-white/90 italic">Settings</h1>
              <p className="text-xs text-muted-foreground font-light">Manage your account preferences</p>
            </div>
          </div>

          {/* Profile Section */}
          <section className="glass-panel rounded-3xl p-7 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-transparent pointer-events-none" />
            <h2 className="text-[11px] text-white/40 uppercase tracking-widest font-light mb-5">Profile</h2>
            <div className="space-y-4">
              <InputField
                label="Display Name"
                icon={User}
                value={displayName}
                onChange={setDisplayName}
                placeholder="Your display name"
                hint="This is how you'll appear across Sonuria"
                error={errors.displayName}
              />
              <InputField
                label="Username"
                icon={AtSign}
                value={username}
                onChange={setUsername}
                placeholder="your_handle"
                hint="Unique handle — letters, numbers, and underscores"
                error={errors.username}
              />
            </div>

            {errors.general && (
              <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="text-sm text-rose-400 font-light">{errors.general}</span>
              </div>
            )}

            <div className="flex items-center justify-between mt-6">
              {saved && (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-light">Changes saved</span>
                </div>
              )}
              {!saved && <span />}
              <Button
                variant="glow"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="font-light"
              >
                {updateMutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </section>

          {/* Ember Purchases Section */}
          <section className="glass-panel rounded-3xl p-7 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[11px] text-white/40 uppercase tracking-widest font-light">Ember History</h2>
              <Link href="/billing">
                <button className="flex items-center gap-1 text-[11px] text-primary/60 hover:text-primary/90 transition-colors">
                  Buy Embers <ChevronRight className="w-3 h-3" />
                </button>
              </Link>
            </div>

            {transactions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-amber-400/50" />
                </div>
                <p className="text-sm text-white/30 font-light">No ember transactions yet</p>
                <Link href="/billing">
                  <Button variant="outline" size="sm" className="font-light text-xs mt-1">
                    Purchase Embers
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.04]"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        tx.type === "credit" ? "bg-amber-500/15" : "bg-white/[0.05]"
                      )}>
                        <Flame className={cn("w-4 h-4", tx.type === "credit" ? "text-amber-400" : "text-white/30")} />
                      </div>
                      <div>
                        <p className="text-sm text-white/80 font-light">{tx.description ?? (tx.type === "credit" ? "Ember credit" : "Ember used")}</p>
                        <p className="text-[11px] text-white/30 font-light">
                          {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      tx.type === "credit" ? "text-amber-400" : "text-white/40"
                    )}>
                      {tx.type === "credit" ? "+" : "-"}{tx.amount}
                      <span className="text-[10px] text-white/30 font-light ml-1">embers</span>
                    </span>
                  </div>
                ))}
                {transactions.length > 5 && (
                  <p className="text-center text-[11px] text-white/25 font-light pt-1">
                    Showing latest 5 of {transactions.length} transactions
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Quick Links */}
          <section className="glass-panel rounded-3xl p-7 relative overflow-hidden">
            <h2 className="text-[11px] text-white/40 uppercase tracking-widest font-light mb-4">More</h2>
            <div className="space-y-1">
              {[
                { href: "/billing", label: "Billing & Embers", icon: Flame },
                { href: "/help", label: "Help & Support", icon: SettingsIcon },
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}>
                  <div className="flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                      <span className="text-sm text-white/60 group-hover:text-white/90 font-light transition-colors">{label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
