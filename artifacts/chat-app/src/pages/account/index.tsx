import { useAuth } from "@workspace/replit-auth-web";
import { useGetAccount, useListCharacters } from "@workspace/api-client-react";
import { Avatar } from "@/components/ui/avatar";
import { CharacterCard } from "@/components/shared/character-card";
import { MessageSquareHeart, Star } from "lucide-react";

export function Account() {
  const { user, isAuthenticated } = useAuth();
  const { data: accountData, isLoading } = useGetAccount({ query: { enabled: isAuthenticated } });
  const { data: charsData } = useListCharacters();

  if (!isAuthenticated) return <div className="min-h-screen pt-24 text-center">Please log in to view your account.</div>;
  if (isLoading) return <div className="min-h-screen pt-24 flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const allChars = charsData?.characters || [];
  const favoriteChars = allChars.filter(c => accountData?.favorites?.includes(c.slug));

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Header */}
        <div className="glass-panel rounded-3xl p-8 mb-12 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
          <Avatar src={user?.profileImageUrl} name={user?.firstName || "User"} size="xl" className="ring-4 ring-white/10" />
          <div className="text-center md:text-left z-10">
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              Welcome back, {user?.firstName || "User"}
            </h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
          
          <div className="md:ml-auto flex gap-6 z-10">
            <div className="text-center bg-black/40 rounded-2xl p-6 border border-white/5 min-w-[140px]">
              <MessageSquareHeart className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{accountData?.totalChats || 0}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Chats</div>
            </div>
            <div className="text-center bg-black/40 rounded-2xl p-6 border border-white/5 min-w-[140px]">
              <Star className="w-6 h-6 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{accountData?.favorites?.length || 0}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Favorites</div>
            </div>
          </div>
        </div>

        {/* Favorites Grid */}
        <div>
          <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
            <Heart className="w-6 h-6 text-pink-500 fill-pink-500" /> Your Favorites
          </h2>
          {favoriteChars.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoriteChars.map(char => (
                <CharacterCard key={char.id} character={char} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
              <h3 className="text-xl font-bold text-white mb-2">No favorites yet</h3>
              <p className="text-muted-foreground mb-6">Discover characters and click the heart icon to save them here.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// Quick import fix for Heart icon missed above
import { Heart } from "lucide-react";
