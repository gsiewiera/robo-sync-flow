import { ReactNode, useState, useEffect, useRef } from "react";
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
  Receipt,
  UserPlus,
  Shield,
  Trophy,
  Target
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

interface NavItem {
  icon: any;
  label: string;
  path: string;
  roles: string[];
}

const allNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", roles: ["admin", "manager", "salesperson", "technician"] },
  { icon: CheckSquare, label: "Tasks", path: "/tasks", roles: ["admin", "manager", "salesperson", "technician"] },
  { icon: UserPlus, label: "Leads", path: "/leads", roles: ["admin", "manager", "salesperson"] },
  { icon: ShoppingCart, label: "Offers", path: "/offers", roles: ["admin", "manager", "salesperson"] },
  { icon: TrendingUp, label: "Funnel", path: "/funnel", roles: ["admin", "manager"] },
  { icon: Users, label: "Clients", path: "/clients", roles: ["admin", "manager", "salesperson"] },
  { icon: Building2, label: "Resellers", path: "/resellers", roles: ["admin", "manager", "salesperson"] },
  { icon: FileText, label: "Contracts", path: "/contracts", roles: ["admin", "manager", "salesperson"] },
  { icon: Receipt, label: "Invoices", path: "/invoices", roles: ["admin", "manager", "salesperson"] },
  { icon: Wrench, label: "Service", path: "/service", roles: ["admin", "manager", "technician"] },
  { icon: Bot, label: "Robots", path: "/robots", roles: ["admin", "manager", "technician"] },
  { icon: Package, label: "Items", path: "/items", roles: ["admin", "manager"] },
  { icon: DollarSign, label: "Pricing", path: "/pricing", roles: ["admin", "manager"] },
  { icon: Trophy, label: "Leaderboard", path: "/leaderboard", roles: ["admin", "manager"] },
  { icon: Target, label: "Goals", path: "/goals", roles: ["admin", "manager"] },
  { icon: Shield, label: "Admin", path: "/admin/users", roles: ["admin"] },
];

const reportItems: NavItem[] = [
  { icon: Activity, label: "Activity", path: "/reports/activity", roles: ["admin", "manager"] },
  { icon: BarChart3, label: "Sales", path: "/reports/sales", roles: ["admin", "manager"] },
  { icon: Building, label: "Reseller", path: "/reports/reseller", roles: ["admin", "manager"] },
  { icon: CalendarClock, label: "Ending", path: "/reports/ending", roles: ["admin", "manager"] },
];

function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [reportsOpen, setReportsOpen] = useState(
    location.pathname.startsWith("/reports")
  );
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const reportsRef = useRef<HTMLDivElement>(null);

  const handleReportsToggle = (open: boolean) => {
    setReportsOpen(open);
    if (open && reportsRef.current) {
      setTimeout(() => {
        reportsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const fetchUserRoles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRolesLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (data) {
        setUserRoles(data.map(r => r.role));
      }
    } catch (error) {
      console.error("Failed to fetch user roles:", error);
    } finally {
      setRolesLoading(false);
    }
  };

  const navItems = allNavItems.filter(item => 
    item.roles.some(role => userRoles.includes(role))
  );

  const filteredReportItems = reportItems.filter(item => 
    item.roles.some(role => userRoles.includes(role))
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

        {rolesLoading ? (
          <div className="p-4 space-y-2">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-8 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <>
            {navItems.length > 0 && (
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
            )}

            {filteredReportItems.length > 0 && (
              <SidebarGroup ref={reportsRef}>
                <Collapsible open={reportsOpen} onOpenChange={handleReportsToggle}>
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
                        {filteredReportItems.map((item) => {
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
            )}
          </>
        )}
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
