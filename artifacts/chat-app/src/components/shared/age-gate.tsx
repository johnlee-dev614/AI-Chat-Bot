import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/use-app-store";
import { Button } from "@/components/ui/button";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { useState } from "react";

export function AgeGate() {
  const { ageVerified, setAgeVerified, disclaimerAcknowledged, setDisclaimerAcknowledged } =
    useAppStore();
  const [denied, setDenied] = useState(false);

  if (ageVerified && disclaimerAcknowledged) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/98 backdrop-blur-2xl"
      >
        {/* Ambient bedroom glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/10 blur-[140px] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent/8 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 glass-panel p-8 md:p-12 rounded-3xl max-w-md w-full text-center">
          {!ageVerified ? (
            <>
              <div className="w-14 h-14 bg-primary/10 border border-primary/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="w-6 h-6 text-primary/80" />
              </div>
              <h2 className="font-display text-3xl font-semibold italic text-white/90 mb-3">
                Are you 18 or older?
              </h2>
              <p className="text-muted-foreground/70 font-light text-sm leading-relaxed mb-8">
                Sonuria features mature themes and AI-generated interactions intended for adults only.
              </p>

              {denied ? (
                <div className="bg-destructive/8 text-destructive/80 p-4 rounded-2xl border border-destructive/20 text-sm font-light">
                  You must be 18 or older to access Sonuria.
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setDenied(true)}
                    className="flex-1 font-light tracking-wide border-white/10 hover:border-white/20 rounded-2xl"
                  >
                    No, I'm under 18
                  </Button>
                  <Button
                    variant="glow"
                    size="lg"
                    onClick={() => setAgeVerified(true)}
                    className="flex-1 font-light tracking-wide rounded-2xl shadow-[0_0_30px_-8px_hsl(var(--primary)/0.5)]"
                  >
                    Yes, I'm 18+
                  </Button>
                </div>
              )}
            </>
          ) : (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="w-14 h-14 bg-accent/10 border border-accent/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-6 h-6 text-accent/80" />
              </div>
              <h2 className="font-display text-3xl font-semibold italic text-white/90 mb-3">
                A gentle reminder
              </h2>
              <p className="text-muted-foreground/70 font-light text-sm leading-relaxed mb-8">
                Sonuria's companions are entirely fictional AI personas. All conversations,
                statements, and personalities are{" "}
                <span className="text-white/60">AI-generated</span> and do not represent
                real people, events, or facts.
              </p>
              <Button
                variant="glow"
                size="lg"
                onClick={() => setDisclaimerAcknowledged(true)}
                className="w-full font-light tracking-wide rounded-2xl shadow-[0_0_30px_-8px_hsl(var(--primary)/0.5)]"
              >
                I Understand — Enter
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
