import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Moon, LogIn } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export function Login() {
  const { login, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/characters");
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-mesh">
      {/* Ambient bedroom glows */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-primary/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-accent/8 blur-[120px] rounded-full" />
      </div>

      <div className="glass-panel p-10 rounded-3xl max-w-md w-full relative z-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/80 to-accent/70 flex items-center justify-center shadow-[0_0_30px_-6px_hsl(var(--primary)/0.5)] mx-auto mb-8">
          <Moon className="w-6 h-6 text-white" />
        </div>

        <h1 className="font-display text-3xl font-semibold italic text-white/90 mb-3">
          Welcome to Sonuria
        </h1>
        <p className="text-muted-foreground/70 font-light text-sm leading-relaxed mb-8">
          Sign in to save your companions, sync favorites, and pick up every conversation right where you left off.
        </p>

        <Button
          variant="glow"
          size="lg"
          className="w-full h-13 font-light tracking-wide rounded-2xl shadow-[0_0_30px_-8px_hsl(var(--primary)/0.5)]"
          onClick={login}
        >
          <LogIn className="w-4 h-4 mr-2" /> Continue with Replit
        </Button>

        <p className="text-xs text-muted-foreground/40 font-light mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
