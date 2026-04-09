import { Link, useLocation } from "wouter";
import { User, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@workspace/replit-auth-web";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [location] = useLocation();
  const { user, isAuthenticated, login, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/characters", label: "Discover" },
    ...(isAuthenticated ? [{ href: "/account", label: "My Account" }] : []),
  ];

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
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="Sonuria"
              className="w-9 h-9 object-contain transition-all duration-500 drop-shadow-[0_0_12px_rgba(180,80,120,0.35)] group-hover:drop-shadow-[0_0_20px_rgba(180,80,120,0.55)]"
            />
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
                <Link href="/account" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors duration-300">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary/80" />
                  </div>
                  <span className="font-light">{user?.displayName || "Account"}</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={logout} title="Log out">
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                </Button>
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
