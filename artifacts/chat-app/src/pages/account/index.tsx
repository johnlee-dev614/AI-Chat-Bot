import { useAuth } from "@workspace/replit-auth-web";
import { useGetAccount, useListCharacters } from "@workspace/api-client-react";
import { Avatar } from "@/components/ui/avatar";
import { CharacterCard } from "@/components/shared/character-card";
import { Heart, MessageSquareHeart, Star } from "lucide-react";
import { motion } from "framer-motion";

export function Account() {
  const { user, isAuthenticated } = useAuth();
  const { data: accountData, isLoading } = useGetAccount({ query: { enabled: isAuthenticated } });
  const { data: charsData } = useListCharacters();

  if (!isAuthenticated)
    return (
      <div className="min-h-screen pt-24 text-center text-muted-foreground font-light italic">
        Please sign in to view your account.
      </div>
    );

  if (isLoading)
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="flex gap-1">
          {[0, 0.18, 0.36].map((d, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: `${d}s` }} />
          ))}
        </div>
      </div>
    );

  const allChars = charsData?.characters || [];
  const favoriteChars = allChars.filter(c => accountData?.favorites?.includes(c.slug));

  return (
    <div className="min-h-screen pt-24 pb-20 bg-mesh">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-primary/7 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="glass-panel rounded-3xl p-8 mb-12 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.06] to-transparent pointer-events-none" />

          <Avatar
            src={user?.profileImageUrl}
            name={user?.firstName || "User"}
            size="xl"
            className="ring-4 ring-primary/15"
          />

          <div className="text-center md:text-left z-10">
            <h1 className="font-display text-3xl font-semibold italic text-white/90 mb-1">
              Welcome back, {user?.firstName || "friend"}
            </h1>
            <p className="text-muted-foreground/60 font-light text-sm">{user?.email}</p>
          </div>

          <div className="md:ml-auto flex gap-4 z-10">
            <div className="text-center bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06] min-w-[120px]">
              <MessageSquareHeart className="w-5 h-5 text-primary/70 mx-auto mb-2" />
              <div className="text-2xl font-display font-semibold text-white/90">
                {accountData?.totalChats || 0}
              </div>
              <div className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-light mt-0.5">
                Chats
              </div>
            </div>
            <div className="text-center bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06] min-w-[120px]">
              <Star className="w-5 h-5 text-accent/70 mx-auto mb-2" />
              <div className="text-2xl font-display font-semibold text-white/90">
                {accountData?.favorites?.length || 0}
              </div>
              <div className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-light mt-0.5">
                Favorites
              </div>
            </div>
          </div>
        </motion.div>

        {/* Favorites Grid */}
        <div>
          <h2 className="font-display text-2xl font-semibold italic text-white/85 mb-6 flex items-center gap-3">
            <Heart className="w-5 h-5 text-primary/70 fill-primary/60" />
            Your Favorites
          </h2>

          {favoriteChars.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {favoriteChars.map((char, i) => (
                <motion.div
                  key={char.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                >
                  <CharacterCard character={char} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-card/30 rounded-3xl border border-white/[0.05]">
              <Heart className="w-8 h-8 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold italic text-white/60 mb-2">
                No favorites yet
              </h3>
              <p className="text-muted-foreground/50 font-light text-sm">
                Visit a companion's profile and tap the heart to save them here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
