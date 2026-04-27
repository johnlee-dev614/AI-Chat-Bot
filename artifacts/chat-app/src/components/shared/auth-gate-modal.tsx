import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface AuthGateModalProps {
  open: boolean;
  onClose: () => void;
  characterName?: string;
}

export function AuthGateModal({ open, onClose, characterName }: AuthGateModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-4"
          >
            <div className="pointer-events-auto w-full max-w-sm glass-panel rounded-3xl p-8 relative overflow-hidden">
              {/* Ambient glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/15 blur-[80px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 blur-[60px] rounded-full pointer-events-none" />

              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-all duration-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="relative z-10 text-center">
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/20 flex items-center justify-center mx-auto mb-5">
                  <MessageCircle className="w-6 h-6 text-primary/80" />
                </div>

                <h2 className="font-display text-2xl font-semibold italic text-white/90 mb-2">
                  Join to Enter
                </h2>
                <p className="text-sm text-muted-foreground/65 font-light leading-relaxed mb-7">
                  {characterName
                    ? `Create a free account to start chatting with ${characterName}.`
                    : "Create a free account to start chatting with your companion."}
                </p>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <Link href="/signup" onClick={onClose}>
                    <Button
                      variant="glow"
                      className="w-full gap-2 font-light tracking-wide rounded-2xl shadow-[0_0_25px_-6px_hsl(var(--primary)/0.5)]"
                    >
                      <Sparkles className="w-4 h-4" />
                      Create Account
                    </Button>
                  </Link>

                  <Link href="/login" onClick={onClose}>
                    <button className="w-full py-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-sm font-light text-white/60 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/[0.14] transition-all duration-300">
                      Sign in to existing account
                    </button>
                  </Link>
                </div>

                <p className="text-xs text-muted-foreground/35 font-light mt-5">
                  Free to join · No credit card required
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
