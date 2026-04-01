import { Link } from "wouter";
import { Character } from "@workspace/api-client-react";
import { Avatar } from "@/components/ui/avatar";
import { Heart, MessageCircle } from "lucide-react";
import { useAddFavorite, useRemoveFavorite, useGetFavorites } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function CharacterCard({ character }: { character: Character }) {
  const { isAuthenticated, login } = useAuth();
  const { data: favoritesData } = useGetFavorites({ query: { enabled: isAuthenticated } });
  const isFavorite = favoritesData?.favorites?.includes(character.slug);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addFav = useAddFavorite({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/users/favorites"] });
      }
    }
  });

  const removeFav = useRemoveFavorite({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/users/favorites"] });
      }
    }
  });

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Please sign in to save favorites." });
      login();
      return;
    }
    if (isFavorite) {
      removeFav.mutate({ characterSlug: character.slug });
    } else {
      addFav.mutate({ characterSlug: character.slug });
    }
  };

  return (
    <Link href={`/characters/${character.slug}`}>
      <div className="group relative bg-card/60 border border-white/[0.06] rounded-3xl overflow-hidden hover:border-primary/25 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_-12px_hsl(var(--primary)/0.2)] hover:bg-card/80">
        {/* Ambient inner glow on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-b from-primary/[0.04] to-transparent" />

        {/* Favorite button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={toggleFavorite}
            className={cn(
              "w-8 h-8 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center border transition-all duration-300",
              isFavorite
                ? "border-primary/40 text-primary"
                : "border-white/10 text-white/30 hover:text-primary/70 hover:border-primary/25"
            )}
            disabled={addFav.isPending || removeFav.isPending}
          >
            <Heart className={cn("w-3.5 h-3.5", isFavorite && "fill-current")} />
          </button>
        </div>

        <div className="p-7 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-5">
            <Avatar
              src={character.avatarUrl}
              name={character.name}
              size="xl"
              className="border-2 border-background ring-4 ring-white/[0.04] group-hover:ring-primary/15 transition-all duration-500"
            />
            <div className={cn(
              "absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-card",
              character.isOnline
                ? "bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                : "bg-white/20"
            )} />
          </div>

          <h3 className="font-display text-xl font-semibold text-white/90 mb-1 italic group-hover:text-primary/90 transition-colors duration-300">
            {character.name}
          </h3>
          <p className="text-xs text-primary/70 mb-3 font-light tracking-widest uppercase">{character.category}</p>
          <p className="text-sm text-muted-foreground font-light line-clamp-2 mb-5 h-10 leading-relaxed">
            {character.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap justify-center gap-1.5 mb-6">
            {character.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.07] text-white/50 font-light">
                {tag}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="w-full flex items-center justify-center gap-2 text-sm font-light text-white/50 group-hover:text-primary/80 transition-all duration-300 bg-white/[0.03] group-hover:bg-primary/8 border border-transparent group-hover:border-primary/15 py-3 rounded-2xl">
            <MessageCircle className="w-4 h-4" />
            <span className="tracking-wide">Enter Room</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
