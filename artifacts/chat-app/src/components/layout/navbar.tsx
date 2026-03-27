import { Link, useLocation } from "wouter";
import { Sparkles, User, LogOut, Menu, X } from "lucide-react";
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
          "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b",
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-white/10 py-3 shadow-lg"
            : "bg-transparent border-transparent py-5"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.3)] group-hover:shadow-[0_0_25px_rgba(147,51,234,0.6)] transition-all">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white">Lumina</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-white",
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
                <Link href="/account" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors">
                  {user?.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  {user?.firstName || "Account"}
                </Link>
                <Button variant="ghost" size="icon" onClick={logout} title="Log out">
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <Button variant="glow" onClick={login}>
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-white"
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-3xl pt-24 px-4 pb-6 flex flex-col md:hidden"
          >
            <div className="flex flex-col gap-6 text-center text-lg">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "font-display font-medium p-4 rounded-xl transition-colors",
                    location === link.href ? "bg-white/10 text-white" : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px w-full bg-white/10 my-2" />
              {isAuthenticated ? (
                <Button variant="outline" className="w-full" onClick={() => { setMobileMenuOpen(false); logout(); }}>
                  Log Out
                </Button>
              ) : (
                <Button variant="glow" className="w-full" onClick={() => { setMobileMenuOpen(false); login(); }}>
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
