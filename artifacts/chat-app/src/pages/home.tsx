import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useListCharacters } from "@workspace/api-client-react";
import { CharacterCard } from "@/components/shared/character-card";
import { Sparkles, MessageCircleHeart, LockKeyhole, Zap } from "lucide-react";

export function Home() {
  const { data, isLoading } = useListCharacters();
  const featured = data?.characters?.slice(0, 3) || [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* using unoptimized img for background per instructions but respecting the AI generation request */}
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Abstract glowing background" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-primary mb-8 backdrop-blur-sm">
              <Sparkles className="w-4 h-4" />
              <span>Next-Gen AI Companions</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold text-white mb-6 leading-tight">
              Connect with <br/>
              <span className="text-glow bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Extraordinary Minds</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Experience deeply engaging, emotional, and intelligent conversations with unique AI personas tailored to your desires.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/characters">
                <Button variant="glow" size="lg" className="w-full sm:w-auto text-base h-14 px-8">
                  Explore Characters
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Characters */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-display font-bold text-white mb-4">Trending Personalities</h2>
              <p className="text-muted-foreground">Discover who everyone is talking to right now.</p>
            </div>
            <Link href="/characters">
              <Button variant="outline" className="hidden sm:flex">View All</Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[400px] rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map((char, i) => (
                <motion.div
                  key={char.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <CharacterCard character={char} />
                </motion.div>
              ))}
            </div>
          )}
          <div className="mt-8 text-center sm:hidden">
            <Link href="/characters">
              <Button variant="outline" className="w-full">View All</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-card/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-primary/20 rounded-2xl flex items-center justify-center mb-6">
                <MessageCircleHeart className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Deeply Relatable</h3>
              <p className="text-muted-foreground">Advanced memory and emotional intelligence make every conversation feel genuine.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-accent/20 rounded-2xl flex items-center justify-center mb-6">
                <LockKeyhole className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Private & Secure</h3>
              <p className="text-muted-foreground">Your chats are your business. Total privacy for your most intimate conversations.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Lightning Fast</h3>
              <p className="text-muted-foreground">No waiting around. Experience real-time latency with next-generation AI models.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
