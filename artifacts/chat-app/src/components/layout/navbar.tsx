import { Link, useLocation } from "wouter";
import { User, LogOut, Menu, X, Flame, Settings, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@workspace/replit-auth-web";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEmbers } from "@/lib/ember-context";

export function Navbar() {
  const [location] = useLocation();
  const { user, isAuthenticated, login, logout } = useAuth();
  const { embers, setShowPaywall } = useEmbers();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = isAuthenticated
    ? [
        { href: "/characters", label: "Discover" },
        { href: "/account", label: "My Account" },
        { href: "/settings", label: "Settings" },
        { href: "/help", label: "Help" },
      ]
    : [];

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-500 border-b",
          scrolled
            ? "bg-background/75 backdrop-blur-2xl border-white/[0.06] py-3 shadow-xl shadow-black/30"
            : "bg-transparent border-transparent py-5"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <img
              src="/wordmark.png"
              alt="Sonuria"
              className="h-9 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-300"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-light tracking-wide transition-colors duration-300 hover:text-white",
                  location === link.href ? "text-white" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {/* Ember balance pill */}
                {embers !== null && (
                  <button
                    onClick={() => setShowPaywall(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-300 hover:scale-105 ${
                      embers <= 0
                        ? "bg-rose-500/10 border-rose-500/25 text-rose-400 hover:bg-rose-500/15"
                        : embers <= 3
                        ? "bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/15"
                        : "bg-amber-500/8 border-amber-500/15 text-amber-300/80 hover:bg-amber-500/12"
                    }`}
                    title="Ember balance — click to top up"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>{embers}</span>
                  </button>
                )}
                <div className="relative group">
                  <Link href="/account" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors duration-300">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary/80" />
                    </div>
                    <span className="font-light">{user?.displayName || "Account"}</span>
                  </Link>
                  <div className="absolute right-0 top-full mt-2 w-44 py-1.5 rounded-2xl bg-background/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                    <Link href="/settings">
                      <div className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer rounded-xl mx-1">
                        <Settings className="w-3.5 h-3.5" /> Settings
                      </div>
                    </Link>
                    <Link href="/billing">
                      <div className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer rounded-xl mx-1">
                        <Flame className="w-3.5 h-3.5" /> Buy Embers
                      </div>
                    </Link>
                    <Link href="/help">
                      <div className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer rounded-xl mx-1">
                        <HelpCircle className="w-3.5 h-3.5" /> Help
                      </div>
                    </Link>
                    <div className="h-px bg-white/[0.06] mx-3 my-1.5" />
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/40 hover:text-rose-400 hover:bg-rose-500/[0.05] transition-colors rounded-xl mx-0"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Log Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Button variant="glow" onClick={login} className="font-light tracking-wide">
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background/97 backdrop-blur-3xl pt-24 px-4 pb-6 flex flex-col md:hidden"
          >
            <div className="flex flex-col gap-6 text-center text-lg">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "font-display italic font-medium p-4 rounded-2xl transition-all duration-300",
                    location === link.href
                      ? "bg-primary/10 text-white border border-primary/20"
                      : "text-muted-foreground hover:bg-white/5"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px w-full bg-white/[0.06] my-2" />
              {isAuthenticated ? (
                <Button variant="outline" className="w-full font-light" onClick={() => { setMobileMenuOpen(false); logout(); }}>
                  Log Out
                </Button>
              ) : (
                <Button variant="glow" className="w-full font-light" onClick={() => { setMobileMenuOpen(false); login(); }}>
                  Sign In
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
