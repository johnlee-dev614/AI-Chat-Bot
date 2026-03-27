import { Link } from "wouter";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background/50 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-lg text-white tracking-tight">Lumina</span>
        </div>
        <p className="text-sm text-muted-foreground text-center md:text-left">
          © {new Date().getFullYear()} Lumina AI. All rights reserved. <br/>
          <span className="text-xs opacity-75">Characters are AI-generated and fictional.</span>
        </p>
        <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/characters" className="hover:text-white transition-colors">Directory</Link>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
