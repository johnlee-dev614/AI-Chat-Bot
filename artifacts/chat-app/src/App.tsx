import { useState } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@workspace/replit-auth-web";
import { EmberProvider } from "@/lib/ember-context";
import { EmberPaywallModal } from "@/components/paywall/EmberModal";

// Layout & Shared
import { Navbar } from "@/components/layout/navbar";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { Footer } from "@/components/layout/footer";
import { AgeGate } from "@/components/shared/age-gate";

// Pages
import { Home } from "@/pages/home";
import { Directory } from "@/pages/characters";
import { CharacterProfile } from "@/pages/characters/profile";
import { ChatView } from "@/pages/chat";
import { Account } from "@/pages/account";
import { Settings } from "@/pages/settings";
import { Help } from "@/pages/help";
import { Billing } from "@/pages/billing";
import { Login } from "@/pages/login";
import { Terms } from "@/pages/terms";
import { Aup } from "@/pages/aup";
import { Privacy } from "@/pages/privacy";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex gap-1">
          {[0, 0.18, 0.36].map((d, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: `${d}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <AgeGate />
        <LeftSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(c => !c)}
        />
        <main
          className="flex-1 min-h-screen bg-mesh transition-[margin-left] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
          style={{ marginLeft: sidebarCollapsed ? 56 : 224 }}
        >
          <Switch>
            <Route path="/chat/:slug" component={ChatView} />
            <Route>
              <div className="pt-8 pb-16">
                <Switch>
                  <Route path="/" component={Home} />
                  <Route path="/characters" component={Directory} />
                  <Route path="/characters/:slug" component={CharacterProfile} />
                  <Route path="/account" component={Account} />
                  <Route path="/settings" component={Settings} />
                  <Route path="/help" component={Help} />
                  <Route path="/billing" component={Billing} />
                  <Route path="/terms" component={Terms} />
                  <Route path="/aup" component={Aup} />
                  <Route path="/privacy" component={Privacy} />
                  <Route component={NotFound} />
                </Switch>
              </div>
            </Route>
          </Switch>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col">
      <AgeGate />
      <Navbar />
      <main className="flex-1 pt-24">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/characters" component={Directory} />
          <Route path="/characters/:slug" component={CharacterProfile} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Login} />
          <Route path="/terms" component={Terms} />
          <Route path="/aup" component={Aup} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/chat/:slug">
            {(params) => <Redirect to={`/characters/${params.slug}`} />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <EmberProvider>
              <AppContent />
              <EmberPaywallModal />
            </EmberProvider>
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
