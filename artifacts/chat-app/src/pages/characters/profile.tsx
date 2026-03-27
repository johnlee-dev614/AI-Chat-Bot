import { useRoute, Link } from "wouter";
import { useGetCharacter, useGetFavorites, useAddFavorite, useRemoveFavorite } from "@workspace/api-client-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Heart, ArrowLeft, Star, Tag } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function CharacterProfile() {
  const [, params] = useRoute("/characters/:slug");
  const slug = params?.slug || "";
  
  const { data: character, isLoading, isError } = useGetCharacter(slug, { query: { enabled: !!slug } });
  
  const { isAuthenticated, login } = useAuth();
  const { data: favoritesData } = useGetFavorites({ query: { enabled: isAuthenticated } });
  const isFavorite = favoritesData?.favorites?.includes(slug);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addFav = useAddFavorite({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/users/favorites"] }) }
  });
  const removeFav = useRemoveFavorite({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/users/favorites"] }) }
  });

  const toggleFavorite = () => {
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Please sign in to save favorites." });
      login();
      return;
    }
    if (isFavorite) removeFav.mutate({ characterSlug: slug });
    else addFav.mutate({ characterSlug: slug });
  };

  if (isLoading) return <div className="min-h-screen pt-24 flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (isError || !character) return <div className="min-h-screen pt-24 text-center">Character not found</div>;

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/characters" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
        </Link>

        <div className="glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start relative z-10">
            <div className="shrink-0 relative">
              <Avatar src={character.avatarUrl} name={character.name} size="2xl" className="ring-8 ring-white/5" />
              <div className={cn(
                "absolute bottom-4 right-4 w-6 h-6 rounded-full border-4 border-card",
                character.isOnline ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]" : "bg-gray-500"
              )} />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4 mb-4">
                <div>
                  <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2">{character.name}</h1>
                  <p className="text-xl text-primary font-medium">{character.category}</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="icon" onClick={toggleFavorite} className={cn(isFavorite && "text-pink-500 border-pink-500/50 bg-pink-500/10")}>
                    <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
                  </Button>
                  <Link href={`/chat/${character.slug}`}>
                    <Button variant="glow" className="gap-2">
                      <MessageCircle className="w-5 h-5" /> Chat Now
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="prose prose-invert max-w-none mb-8">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {character.bio || character.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <h3 className="flex items-center gap-2 text-white font-bold mb-4">
                    <Star className="w-5 h-5 text-accent" /> Personality Traits
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {character.personalityTraits.map(trait => (
                      <span key={trait} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-white/90">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-white font-bold mb-4">
                    <Tag className="w-5 h-5 text-primary" /> Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {character.tags.map(tag => (
                      <span key={tag} className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
