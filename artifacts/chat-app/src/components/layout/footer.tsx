import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.05] bg-background/40 backdrop-blur-sm py-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center">
          <span className="font-display font-semibold text-lg text-white/80 italic tracking-wide">Sonuria</span>
        </div>
        <p className="text-sm text-muted-foreground/70 text-center md:text-left leading-relaxed">
          © {new Date().getFullYear()} Sonuria. All rights reserved.<br />
          <span className="text-xs opacity-70">All companions are AI-generated and entirely fictional.</span>
        </p>
        <div className="flex items-center gap-6 text-sm font-light text-muted-foreground/70">
          <Link href="/characters" className="hover:text-white/90 transition-colors duration-300">Directory</Link>
          <Link href="/terms" className="hover:text-white/90 transition-colors duration-300">Terms</Link>
          <Link href="/aup" className="hover:text-white/90 transition-colors duration-300">Acceptable Use</Link>
          <Link href="/privacy" className="hover:text-white/90 transition-colors duration-300">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
