import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, MessageCircle, Book, Flame, Shield, CreditCard,
  HelpCircle, Paperclip, X, CheckCircle, Send, ChevronRight,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ease = [0.25, 0.46, 0.45, 0.94] as const;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

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
        a: "To request account deletion, please contact us at info@sonuria.com. We will permanently delete your account and all associated data within 30 days.",
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
        a: "Password reset functionality is coming soon. In the meantime, please contact info@sonuria.com for assistance with your account.",
      },
      {
        q: "Can I use Sonuria on mobile?",
        a: "Yes! Sonuria is fully responsive and works great on mobile browsers. A dedicated mobile app is on our roadmap.",
      },
    ],
  },
];

const SUBJECT_OPTIONS = [
  "Select a topic…",
  "Billing or payment issue",
  "Login or account access",
  "Technical problem or bug",
  "Ember or purchase question",
  "Feature request",
  "Other",
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

function ContactForm({ onBack }: { onBack: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [email, setEmail]           = useState("");
  const [subject, setSubject]       = useState(SUBJECT_OPTIONS[0]);
  const [message, setMessage]       = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachErr, setAttachErr]   = useState<string | null>(null);
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setAttachErr(null);
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setAttachErr("File exceeds 5 MB. Please choose a smaller image.");
      e.target.value = "";
      return;
    }
    setAttachment(file);
  }

  function removeFile() {
    setAttachment(null);
    setAttachErr(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!email.trim())                     errs.email   = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email))  errs.email   = "Enter a valid email address.";
    if (!subject || subject === SUBJECT_OPTIONS[0]) errs.subject = "Please choose a topic.";
    if (!message.trim())                   errs.message = "Please describe your issue.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);

    const mailSubject = encodeURIComponent(`[Sonuria Support] ${subject}`);
    const mailBody = encodeURIComponent(
      `From: ${email}\nTopic: ${subject}\n\n${message}`
    );
    window.location.href = `mailto:info@sonuria.com?subject=${mailSubject}&body=${mailBody}`;

    // Brief pause so the mailto has time to trigger before we flip to success
    await new Promise(r => setTimeout(r, 600));
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease }}
        className="text-center py-6"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.45, ease }}
          className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/15 border border-primary/25 mb-5"
        >
          <CheckCircle className="w-7 h-7 text-primary/80" />
        </motion.div>
        <h3 className="text-lg font-display font-semibold text-white/90 italic mb-2">Message sent!</h3>
        <p className="text-sm text-white/45 font-light mb-6 max-w-xs mx-auto">
          We'll get back to you within 24 hours at <span className="text-white/65">{email}</span>.
        </p>
        <button
          onClick={() => { setSubmitted(false); setEmail(""); setSubject(SUBJECT_OPTIONS[0]); setMessage(""); setAttachment(null); }}
          className="text-xs text-primary/60 hover:text-primary/90 transition-colors font-light underline underline-offset-4"
        >
          Send another message
        </button>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease }}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* Email */}
      <div>
        <label className="block text-[11px] text-white/40 uppercase tracking-widest font-light mb-2">
          Your Email
        </label>
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border transition-all",
          errors.email ? "border-rose-500/40" : "border-white/[0.07] focus-within:border-primary/40"
        )}>
          <Mail className="w-4 h-4 text-white/25 shrink-0" />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/20 outline-none font-light"
          />
        </div>
        {errors.email && <p className="mt-1.5 text-[11px] text-rose-400">{errors.email}</p>}
      </div>

      {/* Subject */}
      <div>
        <label className="block text-[11px] text-white/40 uppercase tracking-widest font-light mb-2">
          Subject / Topic
        </label>
        <div className={cn(
          "relative flex items-center px-4 py-3 rounded-xl bg-white/[0.04] border transition-all",
          errors.subject ? "border-rose-500/40" : "border-white/[0.07] focus-within:border-primary/40"
        )}>
          <select
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full bg-transparent text-sm text-white/90 outline-none font-light appearance-none cursor-pointer"
            style={{ colorScheme: "dark" }}
          >
            {SUBJECT_OPTIONS.map(opt => (
              <option key={opt} value={opt} style={{ background: "#1a1a2e", color: "#e5e7eb" }}>
                {opt}
              </option>
            ))}
          </select>
          <ChevronRight className="w-4 h-4 text-white/25 shrink-0 rotate-90 pointer-events-none ml-2" />
        </div>
        {errors.subject && <p className="mt-1.5 text-[11px] text-rose-400">{errors.subject}</p>}
      </div>

      {/* Message */}
      <div>
        <label className="block text-[11px] text-white/40 uppercase tracking-widest font-light mb-2">
          Describe Your Issue
        </label>
        <div className={cn(
          "px-4 py-3 rounded-xl bg-white/[0.04] border transition-all",
          errors.message ? "border-rose-500/40" : "border-white/[0.07] focus-within:border-primary/40"
        )}>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            placeholder="Tell us what happened, what you expected, and any steps to reproduce the issue…"
            className="w-full bg-transparent text-sm text-white/90 placeholder:text-white/20 outline-none font-light resize-none leading-relaxed"
          />
        </div>
        {errors.message && <p className="mt-1.5 text-[11px] text-rose-400">{errors.message}</p>}
      </div>

      {/* Attachment */}
      <div>
        <label className="block text-[11px] text-white/40 uppercase tracking-widest font-light mb-2">
          Attachment <span className="normal-case tracking-normal text-white/20">(optional · image · max 5 MB)</span>
        </label>

        {attachment ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.07]">
            <Paperclip className="w-4 h-4 text-primary/60 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80 font-light truncate">{attachment.name}</p>
              <p className="text-[11px] text-white/30 mt-0.5">{(attachment.size / 1024).toFixed(0)} KB</p>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="text-white/25 hover:text-rose-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-dashed border-white/[0.1] text-white/35 hover:text-white/60 hover:border-white/[0.2] hover:bg-white/[0.05] transition-all duration-200"
          >
            <Paperclip className="w-4 h-4 shrink-0" />
            <span className="text-sm font-light">Attach a screenshot or image…</span>
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
        {attachErr && <p className="mt-1.5 text-[11px] text-rose-400">{attachErr}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-white/30 hover:text-white/60 transition-colors font-light"
        >
          ← Back
        </button>
        <Button
          type="submit"
          variant="glow"
          disabled={submitting}
          className="font-light gap-2 min-w-[140px]"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                className="inline-block w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full"
              />
              Sending…
            </span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Message
            </>
          )}
        </Button>
      </div>
    </motion.form>
  );
}

export function Help() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen pt-0 pb-20 bg-mesh">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/6 blur-[160px] rounded-full animate-glow-breathe" />
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

          {/* Contact Card / Form */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
            className="glass-panel rounded-3xl p-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-transparent pointer-events-none" />

            <AnimatePresence mode="wait">
              {showForm ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Form header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-primary/80" />
                    </div>
                    <div>
                      <h3 className="text-base font-display font-semibold text-white/90 italic">Contact Support</h3>
                      <p className="text-[11px] text-white/35 font-light">We respond within 24 hours</p>
                    </div>
                  </div>
                  <ContactForm onBack={() => setShowForm(false)} />
                </motion.div>
              ) : (
                <motion.div
                  key="card"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/15 border border-primary/20 mb-4">
                    <MessageCircle className="w-6 h-6 text-primary/80" />
                  </div>
                  <h3 className="text-lg font-display font-semibold text-white/90 italic mb-2">Still need help?</h3>
                  <p className="text-sm text-white/45 font-light mb-6 max-w-sm mx-auto">
                    Our support team is here for you. Send us a message and we'll get back to you within 24 hours.
                  </p>
                  <Button
                    variant="glow"
                    className="font-light gap-2"
                    onClick={() => setShowForm(true)}
                  >
                    <Mail className="w-4 h-4" />
                    Contact Support
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
