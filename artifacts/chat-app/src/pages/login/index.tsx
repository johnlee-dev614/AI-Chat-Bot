import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Sparkles, LogIn } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 bg-background overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 blur-[120px] rounded-full" />
      </div>

      <div className="glass-panel p-10 rounded-3xl max-w-md w-full relative z-10 text-center border-t border-white/20">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.4)] mx-auto mb-8">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-3xl font-display font-bold text-white mb-3">Welcome to Lumina</h1>
        <p className="text-muted-foreground mb-8">Sign in to sync your favorite characters and save your conversations.</p>
        
        <Button variant="glow" size="lg" className="w-full h-14 text-lg" onClick={login}>
          <LogIn className="w-5 h-5 mr-2" /> Continue with Replit
        </Button>
        
        <p className="text-xs text-muted-foreground mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
