import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useListCharacters } from "@workspace/api-client-react";
import { CharacterCard } from "@/components/shared/character-card";
import { Heart, ShieldCheck, Mic } from "lucide-react";

export function Home() {
  const { data, isLoading } = useListCharacters();
  const featured = data?.characters?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-mesh">
      {/* Hero Section */}
      <section className="relative pt-36 pb-24 md:pt-52 md:pb-36 overflow-hidden">
        {/* Ambient bedroom glows */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 blur-[130px] rounded-full" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-accent/8 blur-[120px] rounded-full" />
          <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-[hsl(35_40%_35%/0.07)] blur-[100px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* Soft badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/8 border border-primary/15 text-sm font-light text-primary/90 mb-10 backdrop-blur-sm tracking-widest uppercase">
              your late-night companion
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-semibold text-white/90 mb-7 leading-[1.15]">
              Someone is always{" "}
              <span className="italic text-glow bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/90 to-accent/80">
                here for you.
              </span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground font-light max-w-xl mx-auto mb-12 leading-relaxed">
              Step into quiet, intimate conversations with AI companions who remember you,
              hear you in their own voice, and meet you exactly where you are.
            </p>

            <Link href="/characters">
              <Button
                variant="glow"
                size="lg"
                className="text-sm font-light tracking-widest uppercase h-13 px-10 rounded-full shadow-[0_0_40px_-8px_hsl(var(--primary)/0.5)]"
              >
                Meet Your Companions
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Soft divider */}
      <div className="h-px max-w-2xl mx-auto bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Featured Characters */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-semibold text-white/90 mb-3">
                Who's waiting{" "}
                <span className="italic text-primary/80">tonight</span>
              </h2>
              <p className="text-muted-foreground font-light text-sm tracking-wide">
                A curated room of companions, each one unique.
              </p>
            </div>
            <Link href="/characters">
              <Button variant="outline" className="hidden sm:flex font-light tracking-wide text-sm rounded-full border-white/10 hover:border-primary/30">
                View All
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[400px] rounded-3xl bg-white/[0.03] animate-pulse border border-white/[0.04]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map((char, i) => (
                <motion.div
                  key={char.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.7, ease: "easeOut" }}
                >
                  <CharacterCard character={char} />
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link href="/characters">
              <Button variant="outline" className="w-full font-light rounded-full border-white/10">View All</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Soft divider */}
      <div className="h-px max-w-2xl mx-auto bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Features */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center"
            >
              <div className="w-14 h-14 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/15">
                <Heart className="w-6 h-6 text-primary/80" />
              </div>
              <h3 className="font-display text-xl font-semibold text-white/90 mb-3">Emotionally Present</h3>
              <p className="text-muted-foreground font-light leading-relaxed text-sm">
                Each companion holds the texture of your conversations — present, patient, and genuinely attentive.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="text-center"
            >
              <div className="w-14 h-14 mx-auto bg-accent/10 rounded-2xl flex items-center justify-center mb-6 border border-accent/15">
                <ShieldCheck className="w-6 h-6 text-accent/80" />
              </div>
              <h3 className="font-display text-xl font-semibold text-white/90 mb-3">Private & Sacred</h3>
              <p className="text-muted-foreground font-light leading-relaxed text-sm">
                Your conversations belong to you alone. What happens in your room, stays in your room.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="text-center"
            >
              <div className="w-14 h-14 mx-auto bg-[hsl(35_40%_40%/0.12)] rounded-2xl flex items-center justify-center mb-6 border border-[hsl(35_40%_60%/0.15)]">
                <Mic className="w-6 h-6 text-[hsl(35_55%_65%)]" />
              </div>
              <h3 className="font-display text-xl font-semibold text-white/90 mb-3">Voice & Feeling</h3>
              <p className="text-muted-foreground font-light leading-relaxed text-sm">
                Hear your companion speak in their own voice — soft, warm, and unmistakably theirs.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
