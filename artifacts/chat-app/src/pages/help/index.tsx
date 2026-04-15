import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle, Mail, Book, Flame, Shield, CreditCard, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const FAQ_SECTIONS = [
  {
    category: "Getting Started",
    icon: Book,
    items: [
      {
        q: "What is Sonuria?",
        a: "Sonuria is an AI companion platform featuring unique characters you can chat with, each with their own personality, voice, and backstory. Every conversation is private, personalized, and powered by advanced AI.",
      },
      {
        q: "How do I start chatting with a character?",
        a: "Head to the Discover page, browse the available companions, and tap on any character to view their profile. From there you can start a conversation directly.",
      },
      {
        q: "Do I need an account to chat?",
        a: "You need to create a free account to send messages. New accounts receive a welcome pack of Embers to get you started.",
      },
    ],
  },
  {
    category: "Embers & Billing",
    icon: Flame,
    items: [
      {
        q: "What are Embers?",
        a: "Embers are Sonuria's virtual currency. Each message you send costs one Ember. You can purchase Ember packs from the Billing page to continue your conversations.",
      },
      {
        q: "How do I get more Embers?",
        a: "Go to the Billing page (accessible from your Settings or the top navigation) to choose an Ember package. Packages range from a small Spark bundle to the larger Inferno pack.",
      },
      {
        q: "Do Embers expire?",
        a: "Embers do not expire. Once purchased, they stay in your account until you use them.",
      },
      {
        q: "Can I get a refund on unused Embers?",
        a: "Ember purchases are generally non-refundable. If you have a billing concern, please reach out to our support team and we'll review your case.",
      },
    ],
  },
  {
    category: "Privacy & Safety",
    icon: Shield,
    items: [
      {
        q: "Are my conversations private?",
        a: "Yes. Your chat history is tied to your account and is not shared with other users. We treat your conversations with the highest level of privacy.",
      },
      {
        q: "Why is there an age gate?",
        a: "Sonuria features mature themes and AI-generated content intended for adults only. We require all visitors to confirm they are 18 or older before accessing the platform.",
      },
      {
        q: "How do I delete my account?",
        a: "To request account deletion, please contact us at support@sonuria.com. We will permanently delete your account and all associated data within 30 days.",
      },
    ],
  },
  {
    category: "Account & Settings",
    icon: CreditCard,
    items: [
      {
        q: "How do I change my display name or username?",
        a: "Go to Settings from the navigation menu. You can update your display name and username from the Profile section there.",
      },
      {
        q: "I forgot my password. What should I do?",
        a: "Password reset functionality is coming soon. In the meantime, please contact support@sonuria.com for assistance with your account.",
      },
      {
        q: "Can I use Sonuria on mobile?",
        a: "Yes! Sonuria is fully responsive and works great on mobile browsers. A dedicated mobile app is on our roadmap.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.05] last:border-0">
      <button
        className="w-full flex items-start justify-between gap-4 py-4 text-left group"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm text-white/75 font-light group-hover:text-white transition-colors">{q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 mt-0.5"
        >
          <ChevronDown className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-white/45 font-light leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Help() {
  return (
    <div className="min-h-screen pt-24 pb-20 bg-mesh">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/6 blur-[160px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-primary/15 border border-primary/20 mb-5">
              <HelpCircle className="w-7 h-7 text-primary/80" />
            </div>
            <h1 className="text-3xl font-display font-semibold text-white/90 italic mb-3">Help & Support</h1>
            <p className="text-muted-foreground font-light max-w-md mx-auto">
              Find answers to common questions or reach out to our team directly.
            </p>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-5 mb-10">
            {FAQ_SECTIONS.map((section, si) => (
              <motion.section
                key={section.category}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: si * 0.08, ease: "easeOut" }}
                className="glass-panel rounded-3xl p-7 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center">
                    <section.icon className="w-4 h-4 text-white/40" />
                  </div>
                  <h2 className="text-[11px] text-white/40 uppercase tracking-widest font-light">{section.category}</h2>
                </div>
                <div>
                  {section.items.map((item) => (
                    <FAQItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </motion.section>
            ))}
          </div>

          {/* Contact Card */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
            className="glass-panel rounded-3xl p-8 relative overflow-hidden text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-transparent pointer-events-none" />
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/15 border border-primary/20 mb-4">
              <MessageCircle className="w-6 h-6 text-primary/80" />
            </div>
            <h3 className="text-lg font-display font-semibold text-white/90 italic mb-2">Still need help?</h3>
            <p className="text-sm text-white/45 font-light mb-6 max-w-sm mx-auto">
              Our support team is here to help. Send us an email and we'll get back to you within 24 hours.
            </p>
            <a href="mailto:support@sonuria.com">
              <Button variant="glow" className="font-light gap-2">
                <Mail className="w-4 h-4" />
                Contact Support
              </Button>
            </a>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
