import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useAuth } from "@workspace/replit-auth-web";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

// ── Ember cost table (keep in sync with server EMBER_COSTS) ──────────────────
export const EMBER_COSTS = {
  text:       10,  // standard text message
  deepMemory: 15,  // deep memory mode
  voice:      50,  // voice audio generation (additive)
} as const;

interface EmberContextValue {
  embers: number | null;
  isLoading: boolean;
  showPaywall: boolean;
  setShowPaywall: (open: boolean) => void;
  refreshBalance: () => Promise<void>;
  updateEmbers: (newBalance: number) => void;
}

const EmberContext = createContext<EmberContextValue>({
  embers: null,
  isLoading: false,
  showPaywall: false,
  setShowPaywall: () => {},
  refreshBalance: async () => {},
  updateEmbers: () => {},
});

export function EmberProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [embers, setEmbers] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/balance`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setEmbers(data.embers ?? 0);
      }
    } catch {
      // silent — balance will just stay null
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const updateEmbers = useCallback((newBalance: number) => {
    setEmbers(newBalance);
    // Show paywall when balance falls below minimum action cost
    if (newBalance < EMBER_COSTS.text) {
      setShowPaywall(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshBalance();
    } else {
      setEmbers(null);
    }
  }, [isAuthenticated, refreshBalance]);

  return (
    <EmberContext.Provider value={{ embers, isLoading, showPaywall, setShowPaywall, refreshBalance, updateEmbers }}>
      {children}
    </EmberContext.Provider>
  );
}

export function useEmbers() {
  return useContext(EmberContext);
}
