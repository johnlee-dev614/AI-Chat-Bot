import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Sparkles, Zap, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmbers, EMBER_COSTS } from "@/lib/ember-context";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface Package {
  id: string;
  name: string;
  embers: number;
  priceDisplay: string;
  popular: boolean;
  description: string;
  badge?: string;
}

const PKG_ICONS: Record<string, React.ElementType> = {
  embers_500:          Zap,
  embers_1500:         Flame,
  embers_4000:         Sparkles,
  embers_2500_crypto:  Coins,
};

export function EmberPaywallModal() {
  const { showPaywall, setShowPaywall, embers } = useEmbers();
  const [packages, setPackages] = useState<Package[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (showPaywall) {
      fetch(`${API_BASE}/api/payments/packages`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => setPackages(d.packages ?? []))
        .catch(() => {});
    }
  }, [showPaywall]);

  async function handlePurchase(pkg: Package) {
    setPurchasing(pkg.id);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/payments/purchase`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id }),
      });
      const data = await res.json();
      setMessage(data.message || "Payment provider coming soon.");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setPurchasing(null);
    }
  }

  const isOut = (embers ?? 0) < EMBER_COSTS.text;

  return (
    <AnimatePresence>
      {showPaywall && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setShowPaywall(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Slide-over panel — from the right */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 h-full w-full max-w-[420px] z-50 flex flex-col bg-[#130e1c] border-l border-white/[0.07] shadow-[−8px_0_48px_rgba(0,0,0,0.5)] overflow-y-auto"
          >
            {/* Header */}
            <div className="relative px-7 pt-8 pb-5 border-b border-white/[0.05]">
              <button
                onClick={() => setShowPaywall(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-white/35 hover:text-white/75 hover:bg-white/[0.06] transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Flame className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-display italic font-semibold text-white/90 leading-tight">
                    {isOut ? "You're out of Embers" : "Get More Embers"}
                  </h2>
                  <p className="text-sm text-muted-foreground font-light mt-0.5">
                    {isOut ? "Top up to keep the conversation going" : "Choose a bundle below"}
                  </p>
                </div>
              </div>

              {/* Cost breakdown */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Text",    cost: EMBER_COSTS.text,  color: "text-primary/80" },
                  { label: "Memory",  cost: EMBER_COSTS.deepMemory, color: "text-accent/80" },
                  { label: "Voice",   cost: EMBER_COSTS.voice, color: "text-amber-400" },
                ].map(({ label, cost, color }) => (
                  <div key={label} className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-center">
                    <div className={cn("text-sm font-semibold", color)}>
                      <Flame className="w-3 h-3 inline mr-0.5 mb-0.5" />{cost}
                    </div>
                    <div className="text-[10px] text-white/30 font-light uppercase tracking-wider mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Packages */}
            <div className="flex-1 px-7 py-6 space-y-3">
              <p className="text-[11px] text-white/35 uppercase tracking-widest font-light mb-4">Choose a Package</p>

              {packages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  <div className="flex gap-1 justify-center mb-2">
                    {[0, 0.15, 0.3].map((d, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                  Loading packages…
                </div>
              ) : (
                packages.map((pkg) => {
                  const Icon = PKG_ICONS[pkg.id] ?? Flame;
                  const isCrypto = pkg.id.includes("crypto");
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => handlePurchase(pkg)}
                      disabled={!!purchasing}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 text-left",
                        pkg.popular
                          ? "bg-primary/10 border-primary/30 hover:bg-primary/15 hover:border-primary/50"
                          : isCrypto
                          ? "bg-amber-500/[0.06] border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/35"
                          : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10",
                        purchasing === pkg.id ? "opacity-60 cursor-wait" : "cursor-pointer"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          pkg.popular ? "bg-primary/20" : isCrypto ? "bg-amber-500/15" : "bg-white/[0.05]"
                        )}>
                          <Icon className={cn(
                            "w-5 h-5",
                            pkg.popular ? "text-primary/90" : isCrypto ? "text-amber-400" : "text-white/50"
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white/90">{pkg.name}</span>
                            {pkg.badge && (
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                isCrypto
                                  ? "bg-amber-500/15 text-amber-400"
                                  : "bg-primary/20 text-primary/90"
                              )}>
                                {pkg.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground font-light flex items-center gap-1 mt-0.5">
                            <Flame className="w-3 h-3 text-amber-400/70 shrink-0" />
                            {pkg.embers.toLocaleString()} Embers · {pkg.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div className="text-sm font-semibold text-white/90">{pkg.priceDisplay}</div>
                      </div>
                    </button>
                  );
                })
              )}

              {message && (
                <p className="text-center text-sm text-muted-foreground pt-1">{message}</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-7 pb-8 pt-2 border-t border-white/[0.05]">
              <p className="text-center text-[11px] text-white/20 font-light">
                Sonuria · Ralli Inc. · Delaware
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
