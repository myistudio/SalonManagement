import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/app-layout";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Customers from "@/pages/customers";
import Inventory from "@/pages/inventory";
import Services from "@/pages/services";
import Memberships from "@/pages/memberships";
import Reports from "@/pages/reports";
import Bills from "@/pages/bills-simple";
import Staff from "@/pages/staff";
import Stores from "@/pages/stores";
import Settings from "@/pages/settings";
import WhatsApp from "@/pages/whatsapp";
import LoginPageSettings from "@/pages/login-page-settings";
import Appointments from "@/pages/appointments";
import AppointmentBooking from "@/pages/appointment-booking";
import CommunicationSettings from "@/pages/communication-settings";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading for brief period, then default to auth page
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Switch>
      <Route path="/login" component={AuthPage} />
      <Route path="/book-appointment" component={AppointmentBooking} />
      {!isAuthenticated ? (
        <Route component={AuthPage} />
      ) : (
        <AppLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/customers" component={Customers} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/services" component={Services} />
            <Route path="/memberships" component={Memberships} />
            <Route path="/reports" component={Reports} />
            <Route path="/bills" component={Bills} />
            <Route path="/staff" component={Staff} />
            <Route path="/stores" component={Stores} />
            <Route path="/whatsapp" component={WhatsApp} />
            <Route path="/appointments" component={Appointments} />
            <Route path="/settings" component={Settings} />
            <Route path="/settings/login-page" component={LoginPageSettings} />
            <Route path="/settings/communication" component={CommunicationSettings} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      )}
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
