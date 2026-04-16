import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useEmbers } from "@/lib/ember-context";
import { Flame, User, LayoutGrid, Settings, HelpCircle, LogOut, CreditCard, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/characters", label: "Discover",    icon: LayoutGrid },
  { href: "/account",    label: "My Account",  icon: User       },
  { href: "/settings",   label: "Settings",    icon: Settings   },
  { href: "/billing",    label: "Buy Embers",  icon: CreditCard },
  { href: "/help",       label: "Help",        icon: HelpCircle },
];

interface LeftSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function LeftSidebar({ collapsed, onToggle }: LeftSidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { embers, setShowPaywall } = useEmbers();

  return (
    <motion.aside
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0, width: collapsed ? 56 : 224 }}
      transition={{
        opacity: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
        x:       { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
        width:   { duration: 0.30, ease: [0.25, 0.46, 0.45, 0.94] },
      }}
      className="fixed top-0 left-0 h-screen flex flex-col z-40 border-r border-white/[0.06] bg-background/80 backdrop-blur-2xl overflow-hidden"
    >
      {/* Logo + toggle */}
      <div className={cn(
        "flex items-center pt-5 pb-3 shrink-0 transition-all duration-300",
        collapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        {/* Wordmark — fades out when collapsed */}
        <Link href="/" className={cn(
          "transition-all duration-300 overflow-hidden shrink-0",
          collapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-90 hover:opacity-100"
        )}>
          <img
            src="/wordmark.png"
            alt="Sonuria"
            className="h-8 w-auto object-contain"
          />
        </Link>

        {/* Toggle button */}
        <button
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex items-center justify-center rounded-lg border transition-all duration-200 shrink-0",
            "w-7 h-7 bg-white/[0.03] border-white/[0.08] text-white/30",
            "hover:bg-white/[0.07] hover:border-white/[0.15] hover:text-white/60"
          )}
        >
          {collapsed
            ? <PanelLeftOpen  className="w-3.5 h-3.5" />
            : <PanelLeftClose className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      {/* Nav Links */}
      <nav className={cn(
        "flex-1 pt-2 pb-4 space-y-0.5 overflow-y-auto",
        collapsed ? "px-1.5" : "px-3"
      )}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = location === href || location.startsWith(href + "/");
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 2 }}
                transition={{ duration: 0.15 }}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center py-2.5 rounded-xl text-sm font-light transition-all duration-200 cursor-pointer",
                  collapsed ? "justify-center px-0 gap-0" : "gap-3 px-3",
                  active
                    ? "bg-primary/15 text-white border border-primary/20"
                    : "text-white/45 hover:text-white/85 hover:bg-white/[0.05]"
                )}
              >
                <Icon className={cn(
                  "shrink-0 transition-all duration-200",
                  collapsed ? "w-[18px] h-[18px]" : "w-4 h-4",
                  active ? "text-primary/90" : "text-white/35"
                )} />

                {/* Label — slides and fades away on collapse */}
                <span className={cn(
                  "whitespace-nowrap overflow-hidden transition-all duration-300",
                  collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
                )}>
                  {label}
                </span>

                {/* Active dot — only in expanded mode */}
                {active && !collapsed && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="ml-auto w-1 h-1 rounded-full bg-primary/70 shrink-0"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className={cn(
        "pb-5 space-y-1.5 border-t border-white/[0.05] pt-3 shrink-0",
        collapsed ? "px-1.5" : "px-3"
      )}>

        {/* Ember balance */}
        {embers !== null && (
          <button
            onClick={() => setShowPaywall(true)}
            title={collapsed ? `${embers} embers` : undefined}
            className={cn(
              "w-full flex items-center rounded-xl border text-sm font-light transition-all duration-200 hover:scale-[1.02]",
              collapsed ? "justify-center px-0 py-2.5 gap-0" : "gap-2.5 px-3 py-2.5",
              embers <= 0
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/15"
                : embers <= 3
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/15"
                : "bg-amber-500/8 border-amber-500/10 text-amber-300/75 hover:bg-amber-500/12"
            )}
          >
            <Flame className={cn(
              "shrink-0 transition-all duration-200",
              collapsed ? "w-[18px] h-[18px]" : "w-4 h-4"
            )} />
            <span className={cn(
              "text-left whitespace-nowrap overflow-hidden transition-all duration-300",
              collapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"
            )}>
              {embers} embers
            </span>
          </button>
        )}

        {/* User info */}
        <div className={cn(
          "flex items-center py-2 rounded-xl",
          collapsed ? "justify-center px-0 gap-0" : "gap-2.5 px-3"
        )}>
          <div
            title={collapsed ? (user?.displayName || user?.email?.split("@")[0] || "Account") : undefined}
            className="w-7 h-7 rounded-full bg-primary/20 border border-primary/25 flex items-center justify-center shrink-0"
          >
            <User className="w-3.5 h-3.5 text-primary/70" />
          </div>
          <span className={cn(
            "text-sm text-white/60 font-light truncate overflow-hidden transition-all duration-300",
            collapsed ? "max-w-0 opacity-0" : "max-w-[120px] opacity-100"
          )}>
            {user?.displayName || user?.email?.split("@")[0] || "Account"}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title={collapsed ? "Log Out" : undefined}
          className={cn(
            "w-full flex items-center rounded-xl text-sm font-light text-white/30 hover:text-rose-400 hover:bg-rose-500/[0.06] transition-all duration-200",
            collapsed ? "justify-center px-0 py-2.5 gap-0" : "gap-2.5 px-3 py-2.5"
          )}
        >
          <LogOut className={cn(
            "shrink-0 transition-all duration-200",
            collapsed ? "w-[18px] h-[18px]" : "w-4 h-4"
          )} />
          <span className={cn(
            "whitespace-nowrap overflow-hidden transition-all duration-300",
            collapsed ? "max-w-0 opacity-0" : "max-w-[120px] opacity-100"
          )}>
            Log Out
          </span>
        </button>
      </div>
    </motion.aside>
  );
}
