import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useGetCharacter, useGetFavorites, useAddFavorite, useRemoveFavorite } from "@workspace/api-client-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Heart, ArrowLeft, Star, Tag } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AuthGateModal } from "@/components/shared/auth-gate-modal";

export function CharacterProfile() {
  const [, params] = useRoute("/characters/:slug");
  const slug = params?.slug || "";

  const { data: character, isLoading, isError } = useGetCharacter(slug, {
    query: { enabled: !!slug },
  });

  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [, navigate] = useLocation();

  const { isAuthenticated } = useAuth();
  const { data: favoritesData } = useGetFavorites({ query: { enabled: isAuthenticated } });
  const isFavorite = favoritesData?.favorites?.includes(slug);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addFav = useAddFavorite({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/users/favorites"] }) },
  });
  const removeFav = useRemoveFavorite({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/users/favorites"] }) },
  });

  const toggleFavorite = () => {
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Please sign in to save favorites." });
      setAuthGateOpen(true);
      return;
    }
    if (isFavorite) removeFav.mutate({ characterSlug: slug });
    else addFav.mutate({ characterSlug: slug });
  };

  const enterRoom = () => {
    if (!isAuthenticated) {
      setAuthGateOpen(true);
      return;
    }
    navigate(`/chat/${slug}`);
  };

  if (isLoading)
    return (
      <div className="min-h-screen pt-0 flex items-center justify-center">
        <div className="flex gap-1">
          {[0, 0.18, 0.36].map((d, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: `${d}s` }} />
          ))}
        </div>
      </div>
    );
  if (isError || !character)
    return (
      <div className="min-h-screen pt-0 text-center text-muted-foreground font-light italic">
        Character not found
      </div>
    );

  return (
    <div className="min-h-screen pt-0 pb-20 bg-mesh">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-primary/8 blur-[130px] rounded-full animate-glow-breathe" />
        <div className="absolute bottom-1/3 left-1/3 w-[300px] h-[300px] bg-accent/6 blur-[120px] rounded-full animate-glow-breathe-alt" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/characters"
          className="inline-flex items-center text-xs font-light tracking-widest uppercase text-muted-foreground/60 hover:text-white/70 mb-8 transition-colors duration-300"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Back to Directory
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden"
        >
          {/* Soft decorative glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start relative z-10">
            {/* Avatar */}
            <div className="shrink-0 relative animate-float">
              <Avatar
                src={character.avatarUrl}
                name={character.name}
                size="2xl"
                className="ring-8 ring-primary/10"
              />
              <div className={cn(
                "absolute bottom-4 right-4 w-5 h-5 rounded-full border-4 border-card",
                character.isOnline
                  ? "bg-emerald-400/80 animate-pulse-warm"
                  : "bg-white/20",
              )} />
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4 mb-5">
                <div>
                  <h1 className="text-4xl md:text-5xl font-display font-semibold italic text-white/90 mb-1.5">
                    {character.name}
                  </h1>
                  <p className="text-sm text-primary/70 font-light tracking-widest uppercase">
                    {character.category}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={toggleFavorite}
                    className={cn(
                      "w-10 h-10 rounded-2xl border flex items-center justify-center transition-all duration-300",
                      isFavorite
                        ? "border-primary/40 text-primary bg-primary/10"
                        : "border-white/[0.08] text-white/30 hover:text-primary/60 hover:border-primary/25 hover:bg-primary/[0.05]",
                    )}
                  >
                    <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
                  </button>
                  <Button
                    variant="glow"
                    onClick={enterRoom}
                    className="gap-2 font-light tracking-wide rounded-2xl shadow-[0_0_25px_-6px_hsl(var(--primary)/0.5)]"
                  >
                    <MessageCircle className="w-4 h-4" /> Enter Room
                  </Button>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-sm text-muted-foreground font-light leading-loose">
                  {character.bio || character.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <h3 className="flex items-center gap-2 text-xs font-light text-white/40 uppercase tracking-widest mb-4">
                    <Star className="w-3.5 h-3.5 text-accent/60" /> Personality
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {character.personalityTraits.map(trait => (
                      <span
                        key={trait}
                        className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-xs font-light text-white/70"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-xs font-light text-white/40 uppercase tracking-widest mb-4">
                    <Tag className="w-3.5 h-3.5 text-primary/50" /> Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {character.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 rounded-full bg-primary/[0.07] border border-primary/15 text-xs font-light text-primary/80"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AuthGateModal
        open={authGateOpen}
        onClose={() => setAuthGateOpen(false)}
        characterName={character.name}
      />
    </div>
  );
}
