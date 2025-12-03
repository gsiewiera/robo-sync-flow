import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import "@/i18n/config";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Resellers from "./pages/Resellers";
import ResellerDetail from "./pages/ResellerDetail";
import Robots from "./pages/Robots";
import RobotDetail from "./pages/RobotDetail";
import Tasks from "./pages/Tasks";
import Contracts from "./pages/Contracts";
import ContractDetail from "./pages/ContractDetail";
import Offers from "./pages/Offers";
import OfferDetail from "./pages/OfferDetail";
import Funnel from "./pages/Funnel";
import Service from "./pages/Service";
import ServiceDetail from "./pages/ServiceDetail";
import Items from "./pages/Items";
import Pricing from "./pages/Pricing";
import Invoices from "./pages/Invoices";
import Leads from "./pages/Leads";
import Notes from "./pages/Notes";
import AdminUsers from "./pages/AdminUsers";
import UserProfile from "./pages/UserProfile";
import Leaderboard from "./pages/Leaderboard";
import Goals from "./pages/Goals";
import SalespersonPanel from "./pages/SalespersonPanel";
import Settings from "./pages/Settings";
import ActivityReport from "./pages/reports/ActivityReport";
import SalesReport from "./pages/reports/SalesReport";
import ResellerReport from "./pages/reports/ResellerReport";
import EndingReport from "./pages/reports/EndingReport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="/clients/:id" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
          <Route path="/resellers" element={<ProtectedRoute><Resellers /></ProtectedRoute>} />
          <Route path="/resellers/:id" element={<ProtectedRoute><ResellerDetail /></ProtectedRoute>} />
          <Route path="/robots" element={<ProtectedRoute><Robots /></ProtectedRoute>} />
          <Route path="/robots/:id" element={<ProtectedRoute><RobotDetail /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
          <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
          <Route path="/contracts/:id" element={<ProtectedRoute><ContractDetail /></ProtectedRoute>} />
          <Route path="/offers" element={<ProtectedRoute><Offers /></ProtectedRoute>} />
          <Route path="/offers/:id" element={<ProtectedRoute><OfferDetail /></ProtectedRoute>} />
          <Route path="/funnel" element={<ProtectedRoute><Funnel /></ProtectedRoute>} />
          <Route path="/service" element={<ProtectedRoute><Service /></ProtectedRoute>} />
          <Route path="/service/:id" element={<ProtectedRoute><ServiceDetail /></ProtectedRoute>} />
          <Route path="/items" element={<ProtectedRoute><Items /></ProtectedRoute>} />
          <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/users/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
          <Route path="/admin/salesperson-panel" element={<ProtectedRoute><SalespersonPanel /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/reports/activity" element={<ProtectedRoute><ActivityReport /></ProtectedRoute>} />
          <Route path="/reports/sales" element={<ProtectedRoute><SalesReport /></ProtectedRoute>} />
          <Route path="/reports/reseller" element={<ProtectedRoute><ResellerReport /></ProtectedRoute>} />
          <Route path="/reports/ending" element={<ProtectedRoute><EndingReport /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;