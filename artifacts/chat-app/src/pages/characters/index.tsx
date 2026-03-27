import { useState } from "react";
import { useListCharacters } from "@workspace/api-client-react";
import { CharacterCard } from "@/components/shared/character-card";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
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
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Discover</h1>
          <p className="text-lg text-muted-foreground">Find your perfect AI companion from our curated selection.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-10 items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search characters..." 
              className="pl-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
            <Filter className="w-5 h-5 text-muted-foreground mr-2 shrink-0" />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat 
                    ? "bg-white text-black" 
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[400px] rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredCharacters.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredCharacters.map((char) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={char.id}
              >
                <CharacterCard character={char} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-2">No characters found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
