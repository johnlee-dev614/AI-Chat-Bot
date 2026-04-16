import { motion } from "framer-motion";
import { Scale } from "lucide-react";

const sections = [
  {
    number: "1",
    title: "Binding Agreement",
    body: `By accessing Sonuria.com and creating an account, you agree to be bound by these Terms of Use, our Privacy Policy, and our Acceptable Use Policy. These terms constitute a legally binding agreement between you and Ralli Inc. (a Delaware Corporation).`,
  },
  {
    number: "2",
    title: "Eligibility & Age Verification",
    items: [
      {
        label: "Strict 18+ Policy",
        text: "You must be at least 18 years of age (or the age of majority in your jurisdiction).",
      },
      {
        label: "Verification",
        text: "We reserve the right to use third-party age verification services. You agree to provide valid government-issued identification upon request. Failure to verify age will result in immediate account termination.",
      },
      {
        label: "Prohibited Users",
        text: "You may not use this site if you are a convicted sex offender or if your account has been previously disabled for violations of law or our policies.",
      },
    ],
  },
  {
    number: "3",
    title: "Nature of AI Service (Disclaimer)",
    items: [
      {
        label: "Simulated Interaction",
        text: `You acknowledge that all characters and "Creators" on this platform are Artificial Intelligence (AI). They are not human. Any claims of "real-world" identity, location, or feelings are fictional and part of the roleplay experience.`,
      },
      {
        label: "No Professional Advice",
        text: "AI-generated content is for entertainment only. It does not constitute medical, legal, or financial advice.",
      },
    ],
  },
  {
    number: "4",
    title: "Wallet Credits & Financial Terms",
    items: [
      {
        label: "Credit-Based System",
        text: `Access to certain AI features requires the purchase of digital "Credits."`,
      },
      {
        label: "No Refunds",
        text: "All sales of Credits are final and non-refundable. Credits have no cash value and cannot be exchanged for fiat currency.",
      },
      {
        label: "Chargeback Policy",
        text: "If you initiate an unjustified chargeback with your bank, your account will be permanently banned. We reserve the right to report fraudulent chargebacks to specialized anti-fraud databases and collection agencies.",
      },
      {
        label: "Subscriptions",
        text: "If you opt into a recurring subscription, it will automatically renew until cancelled in your account settings.",
      },
    ],
  },
  {
    number: "5",
    title: "Limitation of Liability",
    body: `To the maximum extent permitted by law, Ralli, Inc. and its officers shall not be liable for any indirect, incidental, or consequential damages (including emotional distress) arising from your use of the AI. Our total liability for any claim is capped at $250.00 USD.`,
  },
  {
    number: "6",
    title: "Governing Law & Dispute Resolution",
    body: `This agreement is governed by the laws of the State of Delaware. You agree that any dispute must first be submitted to mandatory mediation for at least 60 days before any legal action is filed.`,
  },
];

export function Terms() {
  return (
    <div className="min-h-screen pt-0 pb-24 bg-mesh">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/6 blur-[160px] rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-accent/5 blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-14"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <Scale className="w-6 h-6 text-primary/70" />
          </div>
          <h1 className="font-display text-4xl font-semibold italic text-white/90 mb-3">
            Terms of Use
          </h1>
          <p className="text-muted-foreground/50 font-light text-sm">
            Sonuria.com · Ralli Inc. · Last updated April 2026
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, i) => (
            <motion.div
              key={section.number}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: "easeOut" }}
              className="glass-panel rounded-2xl p-7"
            >
              <div className="flex items-start gap-4 mb-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-xs font-semibold text-primary/80 font-display">
                  {section.number}
                </span>
                <h2 className="font-display text-lg font-semibold italic text-white/85 leading-snug pt-0.5">
                  {section.title}
                </h2>
              </div>

              <div className="pl-11">
                {section.body && (
                  <p className="text-muted-foreground/70 font-light text-sm leading-relaxed">
                    {section.body}
                  </p>
                )}

                {section.items && (
                  <ul className="space-y-4">
                    {section.items.map((item) => (
                      <li key={item.label}>
                        <span className="text-white/60 font-medium text-sm">
                          {item.label}:{" "}
                        </span>
                        <span className="text-muted-foreground/65 font-light text-sm leading-relaxed">
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center text-xs text-muted-foreground/35 font-light mt-10"
        >
          Questions? Contact us at legal@sonuria.com · Ralli Inc., a Delaware Corporation.
        </motion.p>
      </div>
    </div>
  );
}
