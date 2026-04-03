import { useState, useEffect, useCallback } from "react";
import type { AuthUser } from "@workspace/api-client-react";

export type { AuthUser };

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(() => {
    setIsLoading(true);
    fetch("/api/auth/user", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ user: AuthUser | null }>;
      })
      .then((data) => {
        setUser(data.user ?? null);
        setIsLoading(false);
      })
      .catch(() => {
        setUser(null);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Navigate to the login page — the page itself handles the email/password form.
  const login = useCallback(() => {
    const returnTo = window.location.pathname + window.location.search;
    const base = (import.meta.env.BASE_URL ?? "/").replace(/\/+$/, "");
    window.location.href = `${base}/login?returnTo=${encodeURIComponent(returnTo)}`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore fetch errors — session cookie is cleared regardless
    }
    setUser(null);
    const base = (import.meta.env.BASE_URL ?? "/").replace(/\/+$/, "");
    window.location.href = `${base}/`;
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refetchUser: fetchUser,
  };
}
