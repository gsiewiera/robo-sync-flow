import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import "@/i18n/config";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Eager-loaded (landing + auth)
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy-loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clients = lazy(() => import("./pages/Clients"));
const ClientDetail = lazy(() => import("./pages/ClientDetail"));
const Resellers = lazy(() => import("./pages/Resellers"));
const ResellerDetail = lazy(() => import("./pages/ResellerDetail"));
const Robots = lazy(() => import("./pages/Robots"));
const RobotDetail = lazy(() => import("./pages/RobotDetail"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Contracts = lazy(() => import("./pages/Contracts"));
const ContractDetail = lazy(() => import("./pages/ContractDetail"));
const Offers = lazy(() => import("./pages/Offers"));
const OfferDetail = lazy(() => import("./pages/OfferDetail"));
const Funnel = lazy(() => import("./pages/Funnel"));
const Service = lazy(() => import("./pages/Service"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const Items = lazy(() => import("./pages/Items"));
const Pricing = lazy(() => import("./pages/Pricing"));
const RobotModels = lazy(() => import("./pages/RobotModels"));
const RobotModelDetail = lazy(() => import("./pages/RobotModelDetail"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Leads = lazy(() => import("./pages/Leads"));
const Notes = lazy(() => import("./pages/Notes"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Goals = lazy(() => import("./pages/Goals"));
const SalespersonPanel = lazy(() => import("./pages/SalespersonPanel"));
const Settings = lazy(() => import("./pages/Settings"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const ActivityReport = lazy(() => import("./pages/reports/ActivityReport"));
const SalesReport = lazy(() => import("./pages/reports/SalesReport"));
const ResellerReport = lazy(() => import("./pages/reports/ResellerReport"));
const EndingReport = lazy(() => import("./pages/reports/EndingReport"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">Loading...</div>
);

const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <Suspense fallback={<PageLoader />}>{children}</Suspense>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/clients" element={<Protected><Clients /></Protected>} />
            <Route path="/clients/:id" element={<Protected><ClientDetail /></Protected>} />
            <Route path="/resellers" element={<Protected><Resellers /></Protected>} />
            <Route path="/resellers/:id" element={<Protected><ResellerDetail /></Protected>} />
            <Route path="/campaigns" element={<Protected><Campaigns /></Protected>} />
            <Route path="/robots" element={<Protected><Robots /></Protected>} />
            <Route path="/robots/:id" element={<Protected><RobotDetail /></Protected>} />
            <Route path="/tasks" element={<Protected><Tasks /></Protected>} />
            <Route path="/contracts" element={<Protected><Contracts /></Protected>} />
            <Route path="/contracts/:id" element={<Protected><ContractDetail /></Protected>} />
            <Route path="/offers" element={<Protected><Offers /></Protected>} />
            <Route path="/offers/:id" element={<Protected><OfferDetail /></Protected>} />
            <Route path="/funnel" element={<Protected><Funnel /></Protected>} />
            <Route path="/service" element={<Protected><Service /></Protected>} />
            <Route path="/service/:id" element={<Protected><ServiceDetail /></Protected>} />
            <Route path="/items" element={<Protected><Items /></Protected>} />
            <Route path="/pricing" element={<Protected><Pricing /></Protected>} />
            <Route path="/robot-models" element={<Protected><RobotModels /></Protected>} />
            <Route path="/robot-models/:id" element={<Protected><RobotModelDetail /></Protected>} />
            <Route path="/invoices" element={<Protected><Invoices /></Protected>} />
            <Route path="/leads" element={<Protected><Leads /></Protected>} />
            <Route path="/notes" element={<Protected><Notes /></Protected>} />
            <Route path="/admin/users" element={<Protected><AdminUsers /></Protected>} />
            <Route path="/admin/users/:id" element={<Protected><UserProfile /></Protected>} />
            <Route path="/leaderboard" element={<Protected><Leaderboard /></Protected>} />
            <Route path="/goals" element={<Protected><Goals /></Protected>} />
            <Route path="/admin/salesperson-panel" element={<Protected><SalespersonPanel /></Protected>} />
            <Route path="/settings" element={<Protected><Settings /></Protected>} />
            <Route path="/reports/activity" element={<Protected><ActivityReport /></Protected>} />
            <Route path="/reports/sales" element={<Protected><SalesReport /></Protected>} />
            <Route path="/reports/reseller" element={<Protected><ResellerReport /></Protected>} />
            <Route path="/reports/ending" element={<Protected><EndingReport /></Protected>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
