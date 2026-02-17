import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

// Pages
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import CreateDecision from "@/pages/CreateDecision";
import DecisionDetail from "@/pages/DecisionDetail";
import AdminDashboard from "@/pages/AdminDashboard";
import UseCases from "@/pages/UseCases";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Initializing Clarvoy...</div>;

  if (!user) return <Redirect to="/auth" />;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />

      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>

      <Route path="/new">
        <ProtectedRoute component={CreateDecision} />
      </Route>

      <Route path="/decisions/:id">
        <ProtectedRoute component={DecisionDetail} />
      </Route>

      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} />
      </Route>

      <Route path="/use-cases">
        <ProtectedRoute component={UseCases} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
