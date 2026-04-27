import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useListCharacters, useGetFavorites, useGetRecentChats } from "@workspace/api-client-react";
import { CharacterCard } from "@/components/shared/character-card";
import { Avatar } from "@/components/ui/avatar";
import { Heart, ShieldCheck, Mic, MessageCircle, Clock } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { cn } from "@/lib/utils";
import type { Character } from "@workspace/api-client-react";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

// ── Returning-user section ────────────────────────────────────────────────────

function ResumeCard({ character }: { character: Character }) {
  return (
    <Link href={`/chat/${character.slug}`}>
      <motion.div
        whileHover={{ y: -4, scale: 1.008 }}
        transition={{ duration: 0.28, ease }}
        className="group relative glass-panel rounded-3xl p-6 flex items-center gap-5 hover:border-primary/30 transition-colors duration-500 hover:shadow-[0_12px_40px_-10px_hsl(var(--primary)/0.25)] cursor-pointer overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="relative shrink-0">
          <Avatar
            src={character.avatarUrl}
            name={character.name}
            size="lg"
            className="ring-4 ring-primary/10 group-hover:ring-primary/25 transition-all duration-500"
          />
          <div className={cn(
            "absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-card",
            character.isOnline ? "bg-emerald-400/80 animate-pulse" : "bg-white/20"
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-light text-primary/60 uppercase tracking-widest mb-0.5">
            Continue conversation
          </p>
          <h3 className="font-display text-xl font-semibold italic text-white/90 group-hover:text-primary/90 transition-colors duration-300 truncate">
            {character.name}
          </h3>
          <p className="text-xs text-muted-foreground/55 font-light truncate mt-0.5">
            {character.category}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2 bg-primary/10 group-hover:bg-primary/20 border border-primary/20 group-hover:border-primary/35 rounded-2xl px-4 py-2.5 transition-all duration-300">
          <MessageCircle className="w-4 h-4 text-primary/80" />
          <span className="text-sm font-light text-primary/80 tracking-wide">Resume</span>
        </div>
      </motion.div>
    </Link>
  );
}

function FavCard({ character }: { character: Character }) {
  return (
    <Link href={`/chat/${character.slug}`}>
      <motion.div
        whileHover={{ y: -4, scale: 1.012 }}
        transition={{ duration: 0.26, ease }}
        className="group glass-panel rounded-2xl p-4 flex flex-col items-center text-center hover:border-primary/25 transition-colors duration-400 hover:shadow-[0_8px_28px_-8px_hsl(var(--primary)/0.18)] cursor-pointer"
      >
        <div className="relative mb-3">
          <Avatar
            src={character.avatarUrl}
            name={character.name}
            size="md"
            className="ring-2 ring-white/[0.05] group-hover:ring-primary/20 transition-all duration-400"
          />
          <div className={cn(
            "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card",
            character.isOnline ? "bg-emerald-400/80 animate-pulse" : "bg-white/20"
          )} />
        </div>
        <p className="font-display text-sm font-semibold italic text-white/85 group-hover:text-primary/85 transition-colors duration-300 truncate w-full">
          {character.name}
        </p>
        <p className="text-[10px] text-muted-foreground/50 font-light mt-0.5 truncate w-full">
          {character.category}
        </p>
      </motion.div>
    </Link>
  );
}

function ContinueSection() {
  const { data: recentData } = useGetRecentChats();
  const { data: favData } = useGetFavorites();
  const { data: allChars } = useListCharacters();

  const characters = allChars?.characters || [];
  const recentSlugs = recentData?.recentChats || [];
  const favSlugs = favData?.favorites || [];

  const mostRecent = characters.find(c => c.slug === recentSlugs[0]);

  const favChars = favSlugs
    .map(slug => characters.find(c => c.slug === slug))
    .filter((c): c is Character => Boolean(c))
    .slice(0, 4);

  if (!mostRecent && favChars.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2"
    >
      {mostRecent && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-3.5 h-3.5 text-primary/50" />
            <p className="text-[11px] font-light text-white/35 uppercase tracking-widest">
              Pick up where you left off
            </p>
          </div>
          <ResumeCard character={mostRecent} />
        </div>
      )}

      {favChars.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-3.5 h-3.5 text-primary/50" />
            <p className="text-[11px] font-light text-white/35 uppercase tracking-widest">
              Your favorites
            </p>
          </div>
          <div className={cn(
            "grid gap-3",
            favChars.length === 1 ? "grid-cols-1 max-w-[160px]" :
            favChars.length === 2 ? "grid-cols-2 max-w-xs" :
            favChars.length === 3 ? "grid-cols-3 max-w-sm" :
            "grid-cols-4"
          )}>
            {favChars.map(char => (
              <FavCard key={char.slug} character={char} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </motion.section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function Home() {
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useListCharacters();
  const featured = data?.characters?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-mesh">

      {/* ── Returning-user "continue" strip (authenticated only) ───────── */}
      {isAuthenticated && <ContinueSection />}

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className={cn(
        "relative overflow-hidden",
        isAuthenticated ? "pt-16 pb-16 md:pt-24 md:pb-24" : "pt-36 pb-24 md:pt-52 md:pb-36"
      )}>

        {/* Ambient bedroom glows */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 blur-[130px] rounded-full animate-glow-breathe" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-accent/8 blur-[120px] rounded-full animate-glow-breathe-alt" />
          <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-[hsl(35_40%_35%/0.07)] blur-[100px] rounded-full animate-glow-breathe-slow" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.75, ease }}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/8 border border-primary/15 text-sm font-light text-primary/90 mb-10 backdrop-blur-sm tracking-widest uppercase">
              your late-night companion
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 1.0, ease }}
            className="text-5xl md:text-7xl font-display font-semibold text-white/90 mb-7 leading-[1.15]"
          >
            Someone is always{" "}
            <span className="italic text-glow bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/90 to-accent/80 animate-gradient-drift">
              here for you.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.44, duration: 0.85, ease }}
            className="text-base md:text-lg text-muted-foreground font-light max-w-xl mx-auto mb-12 leading-relaxed"
          >
            Step into quiet, intimate conversations with AI companions who remember you,
            hear you in their own voice, and meet you exactly where you are.
          </motion.p>

          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.64, duration: 0.8, ease }}
            >
              <Link href="/signup">
                <motion.div
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2, ease }}
                  className="inline-block"
                >
                  <Button
                    variant="glow"
                    size="lg"
                    className="text-sm font-light tracking-widest uppercase h-13 px-10 rounded-full shadow-[0_0_40px_-8px_hsl(var(--primary)/0.5)]"
                  >
                    Create Account
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          )}

          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.64, duration: 0.8, ease }}
            >
              <Link href="/characters">
                <motion.div
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2, ease }}
                  className="inline-block"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-sm font-light tracking-widest uppercase h-13 px-10 rounded-full border-white/10 hover:border-primary/30"
                  >
                    Browse All Companions
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Soft divider */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.9, ease }}
        className="h-px max-w-2xl mx-auto bg-gradient-to-r from-transparent via-white/[0.06] to-transparent origin-center"
      />

      {/* ── Featured Characters ───────────────────────────────────────── */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="flex items-end justify-between mb-12"
          >
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
          </motion.div>

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

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, y: -3 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-14 h-14 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/15"
              >
                <Heart className="w-6 h-6 text-primary/80" />
              </motion.div>
              <h3 className="font-display text-xl font-semibold text-white/90 mb-3">Emotionally Present</h3>
              <p className="text-muted-foreground font-light leading-relaxed text-sm">
                Each companion holds the texture of your conversations — present, patient, and genuinely attentive.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.7, ease: "easeOut" }}
              className="text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, y: -3 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-14 h-14 mx-auto bg-accent/10 rounded-2xl flex items-center justify-center mb-6 border border-accent/15"
              >
                <ShieldCheck className="w-6 h-6 text-accent/80" />
              </motion.div>
              <h3 className="font-display text-xl font-semibold text-white/90 mb-3">Private & Sacred</h3>
              <p className="text-muted-foreground font-light leading-relaxed text-sm">
                Your conversations belong to you alone. What happens in your room, stays in your room.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
              className="text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, y: -3 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-14 h-14 mx-auto bg-[hsl(35_40%_40%/0.12)] rounded-2xl flex items-center justify-center mb-6 border border-[hsl(35_40%_60%/0.15)]"
              >
                <Mic className="w-6 h-6 text-[hsl(35_55%_65%)]" />
              </motion.div>
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
