import { useState, useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { motion } from "framer-motion";
import { Flame, CreditCard, Zap, Sparkles, CheckCircle, Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEmbers } from "@/lib/ember-context";
import { Link } from "wouter";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface Package {
  id: string; name: string; embers: number;
  priceDisplay: string; popular: boolean; description: string; badge?: string;
}

const PACKAGE_ICONS: Record<string, React.ElementType> = {
  spark: Zap, flame: Flame, inferno: Sparkles,
};

function CardInput() {
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");

  function formatCard(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }

  return (
    <div className="space-y-3 mt-5">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-3.5 h-3.5 text-white/25" />
        <span className="text-[11px] text-white/30 font-light">Payments are encrypted and secure</span>
      </div>

      <div>
        <label className="block text-[11px] text-white/40 uppercase tracking-widest font-light mb-1.5">Cardholder Name</label>
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Full name on card"
          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.07] focus:border-primary/40 text-sm text-white/90 placeholder:text-white/20 outline-none font-light transition-colors"
        />
      </div>

      <div>
        <label className="block text-[11px] text-white/40 uppercase tracking-widest font-light mb-1.5">Card Number</label>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.07] focus-within:border-primary/40 transition-colors">
          <CreditCard className="w-4 h-4 text-white/25 shrink-0" />
          <input
            value={number}
            onChange={(e) => setNumber(formatCard(e.target.value))}
            placeholder="1234 5678 9012 3456"
            className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/20 outline-none font-light tracking-wider"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-white/40 uppercase tracking-widest font-light mb-1.5">Expiry</label>
          <input
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/YY"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.07] focus:border-primary/40 text-sm text-white/90 placeholder:text-white/20 outline-none font-light transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] text-white/40 uppercase tracking-widest font-light mb-1.5">CVC</label>
          <input
            value={cvc}
            onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="123"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.07] focus:border-primary/40 text-sm text-white/90 placeholder:text-white/20 outline-none font-light transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

export function Billing() {
  const { isAuthenticated, login } = useAuth();
  const { embers } = useEmbers();
  const [packages, setPackages] = useState<Package[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/payments/packages`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const pkgs: Package[] = d.packages ?? [];
        setPackages(pkgs);
        const pop = pkgs.find((p) => p.popular);
        if (pop) setSelected(pop.id);
      })
      .catch(() => {});
  }, []);

  async function handlePurchase() {
    if (!selected) return;
    setPurchasing(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/payments/purchase`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selected }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setMessage(`Payment successful! Your Embers have been added.`);
      } else {
        setMessage(data.message || "Payment provider not yet configured. Check back soon!");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setPurchasing(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-0 flex flex-col items-center justify-center gap-6">
        <p className="text-muted-foreground font-light italic">Sign in to purchase Embers.</p>
        <Button variant="glow" onClick={login}>Sign In</Button>
      </div>
    );
  }

  const selectedPkg = packages.find((p) => p.id === selected);

  return (
    <div className="min-h-screen pt-0 pb-20 bg-mesh">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-amber-500/5 blur-[160px] rounded-full animate-glow-breathe-alt" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-primary/5 blur-[140px] rounded-full animate-glow-breathe-slow" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-semibold text-white/90 italic">Billing & Embers</h1>
              <p className="text-xs text-muted-foreground font-light">Purchase Embers to keep the conversation going</p>
            </div>
          </div>

          {/* Current Balance */}
          {embers !== null && (
            <div className="glass-panel rounded-2xl px-6 py-4 mb-6 flex items-center justify-between">
              <span className="text-sm text-white/50 font-light">Current balance</span>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-lg font-semibold text-amber-300">{embers}</span>
                <span className="text-xs text-white/30 font-light">embers</span>
              </div>
            </div>
          )}

          {/* Package Selection */}
          <section className="glass-panel rounded-3xl p-7 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] to-transparent pointer-events-none" />
            <h2 className="text-[11px] text-white/40 uppercase tracking-widest font-light mb-5">Choose a Package</h2>

            <div className="space-y-3">
              {packages.map((pkg, pkgIdx) => {
                const Icon = PACKAGE_ICONS[pkg.id] ?? Flame;
                const isSelected = selected === pkg.id;
                return (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + pkgIdx * 0.06, duration: 0.4, ease: "easeOut" }}
                  >
                  <button
                    onClick={() => setSelected(pkg.id)}
                    className={cn(
                      "w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all text-left",
                      isSelected
                        ? "bg-primary/10 border-primary/35 ring-1 ring-primary/20"
                        : "bg-white/[0.03] border-white/[0.07] hover:border-white/[0.15] hover:bg-white/[0.05]"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      isSelected ? "bg-primary/20" : "bg-white/[0.06]"
                    )}>
                      <Icon className={cn("w-5 h-5", isSelected ? "text-primary" : "text-white/40")} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white/90">{pkg.name}</span>
                        {pkg.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary/90 font-medium uppercase tracking-wide">
                            {pkg.badge}
                          </span>
                        )}
                        {pkg.popular && !pkg.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium uppercase tracking-wide">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/35 font-light mt-0.5">{pkg.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-white/90">{pkg.priceDisplay}</div>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <Flame className="w-3 h-3 text-amber-400/70" />
                        <span className="text-xs text-amber-300/70 font-light">{pkg.embers} embers</span>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-primary shrink-0 ml-1" />
                    )}
                  </button>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Payment Card Section */}
          <section className="glass-panel rounded-3xl p-7 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
            <h2 className="text-[11px] text-white/40 uppercase tracking-widest font-light mb-1">Payment Details</h2>
            <CardInput />
          </section>

          {/* Purchase Button */}
          {message && (
            <div className={cn(
              "mb-4 flex items-center gap-3 px-5 py-4 rounded-2xl border",
              success
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-white/[0.04] border-white/[0.08] text-white/50"
            )}>
              {success && <CheckCircle className="w-4 h-4 shrink-0" />}
              <span className="text-sm font-light">{message}</span>
            </div>
          )}

          <Button
            variant="glow"
            className="w-full font-light gap-2 py-3 text-base"
            onClick={handlePurchase}
            disabled={!selected || purchasing}
          >
            {purchasing ? "Processing…" : (
              <>
                {selectedPkg ? `Purchase ${selectedPkg.name} — ${selectedPkg.priceDisplay}` : "Select a package"}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>

          <p className="text-center text-[11px] text-white/20 font-light mt-4">
            By completing your purchase you agree to our{" "}
            <Link href="/terms">
              <span className="underline underline-offset-2 hover:text-white/40 cursor-pointer transition-colors">Terms of Service</span>
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
