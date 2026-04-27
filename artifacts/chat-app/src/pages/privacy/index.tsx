import { motion } from "framer-motion";
import { Lock } from "lucide-react";

const sections = [
  {
    number: "1",
    title: "Information We Collect",
    body: "We collect information necessary to provide the Service, including:",
    items: [
      {
        label: "Account Information",
        text: "Email address and password (stored as a one-way cryptographic hash).",
      },
      {
        label: "Verification Data",
        text: "Proof of age and identity documentation where required by our age verification process.",
      },
      {
        label: "Usage Logs",
        text: "Interaction timestamps, IP addresses, and browser metadata collected to maintain security and service integrity.",
      },
    ],
  },
  {
    number: "2",
    title: "Chat Logs & AI Training",
    body: `To improve our personas and system efficiency, your interactions with the AI are recorded. By using the Service, you grant Sonuria, Inc. a non-exclusive, perpetual, worldwide, anonymized license to use your prompts and AI-generated responses for the purposes of quality control, safety monitoring, and AI model refinement. This license does not permit us to share personally identifiable information with third parties for commercial purposes.`,
  },
  {
    number: "3",
    title: "Security & Data Retention",
    items: [
      {
        label: "Encryption",
        text: "We implement industry-standard encryption for data at rest and in transit. However, no digital environment is 100% secure, and we cannot guarantee absolute security.",
      },
      {
        label: "Retention Period",
        text: "Data is retained for as long as your account is active or as required by law to comply with our reporting obligations under applicable regulations, including mandatory reporting duties related to the Protection of Minors.",
      },
      {
        label: "Account Deletion",
        text: "You may request deletion of your account by contacting info@sonuria.com. Certain data may be retained for a limited period to satisfy legal obligations even after account closure.",
      },
    ],
  },
  {
    number: "4",
    title: "Third-Party Disclosure",
    items: [
      {
        label: "No Sale of Data",
        text: "We do not sell your personal data to third parties under any circumstances.",
      },
      {
        label: "AI Infrastructure",
        text: "We share anonymized interaction data with our AI infrastructure providers only as required to generate Service responses. These providers are contractually bound to process data solely for that purpose.",
      },
      {
        label: "Law Enforcement",
        text: "We disclose data to law enforcement only in response to a valid legal warrant or court order, or to fulfill our mandatory reporting duties under the Protection of Minors clause of our Acceptable Use Policy.",
      },
    ],
  },
];

export function Privacy() {
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
            <Lock className="w-6 h-6 text-primary/70" />
          </div>
          <h1 className="font-display text-4xl font-semibold italic text-white/90 mb-3">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground/50 font-light text-sm">
            Sonuria, Inc. · A Delaware Corporation · Last updated April 27, 2026
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
                  <p className={`text-muted-foreground/70 font-light text-sm leading-relaxed ${section.items ? "mb-4" : ""}`}>
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
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center text-xs text-muted-foreground/35 font-light mt-10"
        >
          © 2026 Sonuria, Inc. · Registered Delaware Corporation · Questions? Contact us at info@sonuria.com
        </motion.p>
      </div>
    </div>
  );
}
