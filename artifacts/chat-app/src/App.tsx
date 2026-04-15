import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@workspace/replit-auth-web";
import { EmberProvider } from "@/lib/ember-context";
import { EmberPaywallModal } from "@/components/paywall/EmberModal";

// Layout & Shared
import { Navbar } from "@/components/layout/navbar";
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
  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col">
      <AgeGate />
      
      {/* Hide navbar/footer on specific routes like chat where we want a full screen app feel */}
      <Switch>
        <Route path="/chat/:slug">
          <Navbar />
          <ChatView />
        </Route>
        <Route>
          <Navbar />
          <main className="flex-1">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/characters" component={Directory} />
              <Route path="/characters/:slug" component={CharacterProfile} />
              <Route path="/account" component={Account} />
              <Route path="/settings" component={Settings} />
              <Route path="/help" component={Help} />
              <Route path="/billing" component={Billing} />
              <Route path="/login" component={Login} />
              <Route path="/signup" component={Login} />
              <Route path="/terms" component={Terms} />
              <Route component={NotFound} />
            </Switch>
          </main>
          <Footer />
        </Route>
      </Switch>
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
