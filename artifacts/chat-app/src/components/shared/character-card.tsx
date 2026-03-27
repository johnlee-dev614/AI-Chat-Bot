import { Link } from "wouter";
import { Character } from "@workspace/api-client-react";
import { Avatar } from "@/components/ui/avatar";
import { Heart, MessageSquare } from "lucide-react";
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
      <div className="group relative bg-card border border-white/5 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(147,51,234,0.2)]">
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={toggleFavorite}
            className={cn(
              "w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border transition-all duration-300",
              isFavorite ? "border-pink-500/50 text-pink-500" : "border-white/10 text-white/50 hover:text-white hover:border-white/30"
            )}
            disabled={addFav.isPending || removeFav.isPending}
          >
            <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <Avatar src={character.avatarUrl} name={character.name} size="xl" className="border-2 border-background ring-4 ring-white/5 group-hover:ring-primary/30 transition-all duration-500" />
            <div className={cn(
              "absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-card",
              character.isOnline ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]" : "bg-gray-500"
            )} />
          </div>
          
          <h3 className="font-display text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{character.name}</h3>
          <p className="text-sm text-primary mb-3 font-medium tracking-wide uppercase">{character.category}</p>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">{character.description}</p>
          
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {character.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/80">
                {tag}
              </span>
            ))}
          </div>
          
          <div className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white/70 group-hover:text-white transition-colors bg-white/5 py-3 rounded-xl">
            <MessageSquare className="w-4 h-4" />
            Chat Now
          </div>
        </div>
      </div>
    </Link>
  );
}
