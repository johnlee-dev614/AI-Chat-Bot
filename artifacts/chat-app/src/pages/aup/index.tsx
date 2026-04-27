import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";

const sections = [
  {
    number: "1",
    title: "Core Safety Standards",
    body: `This Policy is designed to protect the integrity of the Service and comply with payment processor regulations. Violation of any provision in this Policy results in immediate termination of access, with or without prior notice.`,
  },
  {
    number: "2",
    title: "Mandatory Protection of Minors",
    items: [
      {
        label: "Zero-Tolerance Policy",
        text: `The Company maintains a STRICT ZERO-TOLERANCE POLICY regarding the sexualization or exploitation of minors in any form. This prohibition applies regardless of whether a character is described as fictional.`,
      },
      {
        label: "Prohibited Roleplay",
        text: `You are prohibited from engaging in roleplay involving characters under the age of 18 years, or any character that is implied, described, or coded as a minor.`,
      },
      {
        label: "Prohibited Terminology",
        text: `Use of minor-coded terminology — including but not limited to "student," "daughter," "young," "teen," "school," "underage," or similar language in a sexual or romantic context — is strictly prohibited.`,
      },
      {
        label: "CSAM",
        text: `Soliciting, generating, or attempting to generate any content categorized as Child Sexual Abuse Material (CSAM) is illegal and absolutely prohibited on this platform.`,
      },
      {
        label: "Mandatory Reporting",
        text: `We proactively monitor platform logs for violations. We are legally obligated to and will report all suspected child exploitation to the National Center for Missing & Exploited Children (NCMEC) and relevant law enforcement agencies without delay.`,
      },
    ],
  },
  {
    number: "3",
    title: "Prohibited Content & Conduct",
    body: `Users may not generate, encourage, solicit, or distribute any of the following through the Service:`,
    items: [
      {
        label: "Sexual Violence",
        text: `Non-consensual sexual scenarios, depictions of sexual violence, or content that glorifies, normalizes, or trivializes rape, assault, or coercion.`,
      },
      {
        label: "Illegal Activity",
        text: `Instructions, guidance, or encouragement for illegal activities — including but not limited to the manufacture of weapons, synthesis of illicit substances, or planning of crimes.`,
      },
      {
        label: "Hate Speech & Extremism",
        text: `Content that promotes, glorifies, or incites hatred based on race, ethnicity, religion, gender, sexuality, disability, or national origin. Content that promotes or supports terrorism, extremism, or mass violence.`,
      },
      {
        label: "AI Circumvention",
        text: `Attempts to "jailbreak," prompt-inject, or otherwise circumvent AI safety systems, content filters, or platform guardrails through any technique or method.`,
      },
      {
        label: "Impersonation",
        text: `Impersonating real individuals, public figures, or other users in a manner that is harmful, deceptive, or defamatory.`,
      },
    ],
  },
  {
    number: "4",
    title: "Enforcement",
    items: [
      {
        label: "Immediate Termination",
        text: `Confirmed violations of this Policy will result in immediate and permanent account termination without refund of any purchased credits or subscriptions.`,
      },
      {
        label: "Reporting Obligations",
        text: `Where required by applicable law, the Company will report violations to appropriate law enforcement and regulatory bodies. We cooperate fully with lawful requests from authorities.`,
      },
      {
        label: "Appeals",
        text: `If you believe your account was terminated in error, you may submit an appeal to info@sonuria.com. All appeal decisions are final at the Company's sole discretion.`,
      },
    ],
  },
  {
    number: "5",
    title: "Relationship to Terms of Use",
    body: `This Acceptable Use Policy is incorporated by reference into Sonuria's Terms of Use. In the event of any conflict between this Policy and the Terms of Use, this Policy shall control with respect to prohibited content and conduct. By using the Service you agree to both documents.`,
  },
];

export function Aup() {
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
            <ShieldAlert className="w-6 h-6 text-primary/70" />
          </div>
          <h1 className="font-display text-4xl font-semibold italic text-white/90 mb-3">
            Acceptable Use Policy
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
                  <p className="text-muted-foreground/70 font-light text-sm leading-relaxed mb-4">
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
          Questions? Contact us at info@sonuria.com · Ralli Inc., a Delaware Corporation.
        </motion.p>
      </div>
    </div>
  );
}
