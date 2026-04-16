import { useState } from "react";
import { useListCharacters } from "@workspace/api-client-react";
import { CharacterCard } from "@/components/shared/character-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

export function Directory() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const { data, isLoading } = useListCharacters();
  const characters = data?.characters || [];

  const categories = ["All", ...Array.from(new Set(characters.map(c => c.category)))];

  const filteredCharacters = characters.filter(char => {
    const matchesSearch = char.name.toLowerCase().includes(search.toLowerCase()) ||
                          char.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === "All" || char.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen pt-0 pb-20 bg-mesh">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/7 blur-[130px] rounded-full animate-glow-breathe" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-accent/6 blur-[120px] rounded-full animate-glow-breathe-alt" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-12 text-center md:text-left"
        >
          <h1 className="text-4xl md:text-5xl font-display font-semibold text-white/90 italic mb-3">
            Discover
          </h1>
          <p className="text-muted-foreground font-light tracking-wide">
            Find your perfect companion from our curated room.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-4 mb-10 items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <Input
              placeholder="Search companions…"
              className="pl-11 bg-card/50 border-white/[0.07] rounded-2xl font-light text-sm placeholder:text-muted-foreground/50 focus:border-primary/30 focus:ring-0 transition-colors duration-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-light tracking-widest uppercase whitespace-nowrap transition-all duration-300 ${
                  activeCategory === cat
                    ? "bg-primary/15 text-primary/90 border border-primary/25"
                    : "bg-white/[0.04] text-muted-foreground hover:bg-white/[0.07] hover:text-white/70 border border-white/[0.07]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[400px] rounded-3xl bg-white/[0.03] animate-pulse border border-white/[0.04]" />
            ))}
          </div>
        ) : filteredCharacters.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {filteredCharacters.map((char) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                key={char.id}
              >
                <CharacterCard character={char} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-24 bg-card/30 rounded-3xl border border-white/[0.05]">
            <h3 className="font-display text-2xl font-semibold text-white/80 italic mb-2">No companions found</h3>
            <p className="text-muted-foreground font-light">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
