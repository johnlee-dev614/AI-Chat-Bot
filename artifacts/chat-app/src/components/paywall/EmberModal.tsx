import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmbers } from "@/lib/ember-context";

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

  return (
    <AnimatePresence>
      {showPaywall && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPaywall(false)}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 sm:inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <div className="w-full sm:max-w-md bg-[#1a1025] border border-white/[0.08] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/60">
              {/* Header */}
              <div className="relative px-6 pt-8 pb-4 text-center">
                <button
                  onClick={() => setShowPaywall(false)}
                  className="absolute top-4 right-4 p-2 rounded-full text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/20 flex items-center justify-center">
                    <Flame className="w-8 h-8 text-amber-400" />
                  </div>
                </div>

                <h2 className="text-2xl font-display italic font-semibold text-white/90 mb-1">
                  {(embers ?? 0) <= 0 ? "You're out of Embers" : "Get More Embers"}
                </h2>
                <p className="text-sm text-muted-foreground font-light">
                  {(embers ?? 0) <= 0
                    ? "Top up to keep the conversation going"
                    : "Each message costs 1 Ember"}
                </p>

                {(embers ?? 0) <= 0 && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs text-amber-400 font-medium">0 Embers remaining</span>
                  </div>
                )}
              </div>

              {/* Packages */}
              <div className="px-6 pb-6 space-y-3">
                {packages.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    Loading packages…
                  </div>
                ) : (
                  packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => handlePurchase(pkg)}
                      disabled={!!purchasing}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${
                        pkg.popular
                          ? "bg-primary/10 border-primary/30 hover:bg-primary/15 hover:border-primary/50"
                          : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10"
                      } ${purchasing === pkg.id ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          pkg.popular ? "bg-primary/20" : "bg-white/[0.05]"
                        }`}>
                          {pkg.popular ? (
                            <Sparkles className="w-5 h-5 text-primary/90" />
                          ) : (
                            <Zap className="w-5 h-5 text-white/50" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white/90">{pkg.name}</span>
                            {pkg.badge && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary/90 font-medium">
                                {pkg.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground font-light">
                            {pkg.embers} Embers · {pkg.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white/90">{pkg.priceDisplay}</div>
                      </div>
                    </button>
                  ))
                )}

                {message && (
                  <p className="text-center text-sm text-muted-foreground pt-2">{message}</p>
                )}

                <p className="text-center text-[11px] text-white/25 pt-2 font-light">
                  Sonuria · Ralli Inc. · Delaware
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
