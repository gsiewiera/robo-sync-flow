import { ReactNode, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Bot, 
  CheckSquare, 
  FileText, 
  ShoppingCart,
  Wrench,
  DollarSign,
  Package,
  Building2,
  Settings as SettingsIcon,
  LogOut,
  TrendingUp,
  BarChart3,
  Activity,
  Building,
  CalendarClock,
  ChevronDown,
  Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { NavLink } from "@/components/NavLink";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: CheckSquare, label: "Tasks", path: "/tasks" },
  { icon: ShoppingCart, label: "Offers", path: "/offers" },
  { icon: TrendingUp, label: "Funnel", path: "/funnel" },
  { icon: Users, label: "Clients", path: "/clients" },
  { icon: Building2, label: "Resellers", path: "/resellers" },
  { icon: FileText, label: "Contracts", path: "/contracts" },
  { icon: Receipt, label: "Invoices", path: "/invoices" },
  { icon: Wrench, label: "Service", path: "/service" },
  { icon: Bot, label: "Robots", path: "/robots" },
  { icon: Package, label: "Items", path: "/items" },
  { icon: DollarSign, label: "Pricing", path: "/pricing" },
];

const reportItems = [
  { icon: Activity, label: "Activity", path: "/reports/activity" },
  { icon: BarChart3, label: "Sales", path: "/reports/sales" },
  { icon: Building, label: "Reseller", path: "/reports/reseller" },
  { icon: CalendarClock, label: "Ending", path: "/reports/ending" },
];

function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [reportsOpen, setReportsOpen] = useState(
    location.pathname.startsWith("/reports")
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon" className="w-32 data-[state=collapsed]:w-14 [&_.peer]:hidden [&>div.peer+div]:left-0">
      <SidebarContent>
        <div className="p-3 border-b border-sidebar-border">
          <h1 className="text-lg font-bold text-sidebar-foreground">
            {open ? "RoboCRM" : "RC"}
          </h1>
          {open && <p className="text-xs text-sidebar-foreground/60">Robot Mgmt</p>}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink to={item.path}>
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible open={reportsOpen} onOpenChange={setReportsOpen}>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center justify-between w-full group/collapsible">
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Reports
                </span>
                <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {reportItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <NavLink to={item.path} className="pl-7">
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === "/settings"}>
              <NavLink to="/settings">
                <SettingsIcon className="w-5 h-5" />
                <span>Settings</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full gap-0">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10 flex h-14 items-center border-b bg-background pl-0 pr-4">
            <SidebarTrigger />
          </div>
          <div className="pl-0 pr-6 pb-6 pt-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
