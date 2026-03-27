import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/use-app-store";
import { Button } from "@/components/ui/button";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { useState } from "react";

export function AgeGate() {
  const { ageVerified, setAgeVerified, disclaimerAcknowledged, setDisclaimerAcknowledged } = useAppStore();
  const [denied, setDenied] = useState(false);

  if (ageVerified && disclaimerAcknowledged) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-xl"
      >
        <div className="glass-panel p-8 md:p-12 rounded-3xl max-w-lg w-full text-center relative overflow-hidden">
          {/* Decorative glows */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/30 blur-[80px] rounded-full" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/30 blur-[80px] rounded-full" />
          
          <div className="relative z-10">
            {!ageVerified ? (
              <>
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldAlert className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-display font-bold text-white mb-4">Are you 18 or older?</h2>
                <p className="text-muted-foreground mb-8">
                  This platform features mature themes and AI-generated interactions intended for adults only.
                </p>
                
                {denied ? (
                  <div className="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20 text-sm">
                    You must be 18 or older to access this platform.
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button variant="outline" size="lg" onClick={() => setDenied(true)} className="flex-1">
                      No, I am under 18
                    </Button>
                    <Button variant="glow" size="lg" onClick={() => setAgeVerified(true)} className="flex-1">
                      Yes, I am 18+
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-3xl font-display font-bold text-white mb-4">AI Disclaimer</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Lumina features fictional AI personas. All interactions, statements, and events are <strong>AI-generated</strong> and not real. They do not represent real people, entities, or facts.
                </p>
                <Button variant="glow" size="lg" onClick={() => setDisclaimerAcknowledged(true)} className="w-full">
                  I Understand & Agree
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
