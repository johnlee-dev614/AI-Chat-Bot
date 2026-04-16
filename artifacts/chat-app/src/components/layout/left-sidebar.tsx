import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useEmbers } from "@/lib/ember-context";
import { Flame, User, LayoutGrid, Settings, HelpCircle, LogOut, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/characters", label: "Discover", icon: LayoutGrid },
  { href: "/account",    label: "My Account", icon: User },
  { href: "/settings",   label: "Settings", icon: Settings },
  { href: "/billing",    label: "Buy Embers", icon: CreditCard },
  { href: "/help",       label: "Help", icon: HelpCircle },
];

export function LeftSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { embers, setShowPaywall } = useEmbers();

  return (
    <aside className="fixed top-0 left-0 h-screen w-56 flex flex-col z-40 border-r border-white/[0.06] bg-background/80 backdrop-blur-2xl">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 border-b border-white/[0.05]">
        <Link href="/">
          <img
            src="/wordmark.png"
            alt="Sonuria"
            className="h-8 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity duration-300"
          />
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = location === href || location.startsWith(href + "/");
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-light transition-all duration-200 cursor-pointer",
                  active
                    ? "bg-primary/15 text-white border border-primary/20"
                    : "text-white/45 hover:text-white/85 hover:bg-white/[0.05]"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", active ? "text-primary/90" : "text-white/35")} />
                <span>{label}</span>
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="ml-auto w-1 h-1 rounded-full bg-primary/70"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Ember balance + user + logout */}
      <div className="px-3 pb-5 space-y-2 border-t border-white/[0.05] pt-3">
        {/* Ember balance */}
        {embers !== null && (
          <button
            onClick={() => setShowPaywall(true)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-light transition-all duration-200 hover:scale-[1.02]",
              embers <= 0
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/15"
                : embers <= 3
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/15"
                : "bg-amber-500/8 border-amber-500/10 text-amber-300/75 hover:bg-amber-500/12"
            )}
            title="Ember balance — click to top up"
          >
            <Flame className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">{embers} embers</span>
          </button>
        )}

        {/* User info */}
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/25 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-primary/70" />
          </div>
          <span className="text-sm text-white/60 font-light truncate flex-1">
            {user?.displayName || user?.email?.split("@")[0] || "Account"}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-light text-white/30 hover:text-rose-400 hover:bg-rose-500/[0.06] transition-all duration-200"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
