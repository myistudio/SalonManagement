import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Customers from "@/pages/customers";
import Inventory from "@/pages/inventory";
import Services from "@/pages/services";
import Memberships from "@/pages/memberships";
import Reports from "@/pages/reports";
import Staff from "@/pages/staff";
import Stores from "@/pages/stores";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={AuthPage} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/customers" component={Customers} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/services" component={Services} />
          <Route path="/memberships" component={Memberships} />
          <Route path="/reports" component={Reports} />
          <Route path="/staff" component={Staff} />
          <Route path="/stores" component={Stores} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
