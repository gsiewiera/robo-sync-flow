import { ReactNode, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  Target,
  UserCog
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
import { LanguageSelector } from "@/components/LanguageSelector";

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  icon: any;
  label: string;
  translationKey: string;
  path: string;
  roles: string[];
}

const allNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", translationKey: "nav.dashboard", path: "/dashboard", roles: ["admin", "manager", "salesperson", "technician"] },
  { icon: CheckSquare, label: "Tasks", translationKey: "nav.tasks", path: "/tasks", roles: ["admin", "manager", "salesperson", "technician"] },
  { icon: UserPlus, label: "Leads", translationKey: "nav.leads", path: "/leads", roles: ["admin", "manager", "salesperson"] },
  { icon: ShoppingCart, label: "Offers", translationKey: "nav.offers", path: "/offers", roles: ["admin", "manager", "salesperson"] },
  { icon: TrendingUp, label: "Funnel", translationKey: "nav.funnel", path: "/funnel", roles: ["admin", "manager"] },
  { icon: Users, label: "Clients", translationKey: "nav.clients", path: "/clients", roles: ["admin", "manager", "salesperson"] },
  { icon: Building2, label: "Resellers", translationKey: "nav.resellers", path: "/resellers", roles: ["admin", "manager", "salesperson"] },
  { icon: FileText, label: "Contracts", translationKey: "nav.contracts", path: "/contracts", roles: ["admin", "manager", "salesperson"] },
  { icon: Receipt, label: "Invoices", translationKey: "nav.invoices", path: "/invoices", roles: ["admin", "manager", "salesperson"] },
  { icon: Wrench, label: "Service", translationKey: "nav.service", path: "/service", roles: ["admin", "manager", "technician"] },
  { icon: Bot, label: "Robots", translationKey: "nav.robots", path: "/robots", roles: ["admin", "manager", "technician"] },
  { icon: Package, label: "Items", translationKey: "nav.items", path: "/items", roles: ["admin", "manager"] },
  { icon: DollarSign, label: "Pricing", translationKey: "nav.pricing", path: "/pricing", roles: ["admin", "manager"] },
  { icon: Trophy, label: "Leaderboard", translationKey: "nav.leaderboard", path: "/leaderboard", roles: ["admin", "manager"] },
  { icon: Target, label: "Goals", translationKey: "nav.goals", path: "/goals", roles: ["admin", "manager"] },
  { icon: UserCog, label: "Salesperson Panel", translationKey: "nav.salespersonPanel", path: "/admin/salesperson-panel", roles: ["admin"] },
  { icon: Shield, label: "Admin", translationKey: "nav.admin", path: "/admin/users", roles: ["admin"] },
];

const reportItems: NavItem[] = [
  { icon: Activity, label: "Activity", translationKey: "reports.activity", path: "/reports/activity", roles: ["admin", "manager"] },
  { icon: BarChart3, label: "Sales", translationKey: "reports.sales", path: "/reports/sales", roles: ["admin", "manager"] },
  { icon: Building, label: "Reseller", translationKey: "reports.reseller", path: "/reports/reseller", roles: ["admin", "manager"] },
  { icon: CalendarClock, label: "Ending", translationKey: "reports.ending", path: "/reports/ending", roles: ["admin", "manager"] },
];

function AppSidebar() {
  const { open } = useSidebar();
  const { t } = useTranslation();
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
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-3 border-b border-sidebar-border">
          <h1 className="text-lg font-bold text-sidebar-foreground">
            {open ? t("app.title") : "RC"}
          </h1>
          {open && <p className="text-xs text-sidebar-foreground/60">{t("app.subtitle")}</p>}
        </div>

        {rolesLoading ? (
          <div className="p-4 space-y-2">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-8 bg-muted animate-pulse rounded" />
          </div>
        ) : userRoles.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-sidebar-foreground/60">
              {t("common.noRolesAssigned", "No roles assigned. Contact an administrator.")}
            </p>
          </div>
        ) : (
          <>
            {navItems.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>{t("nav.navigation")}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;

                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton asChild isActive={isActive} tooltip={t(item.translationKey)}>
                            <NavLink to={item.path}>
                              <Icon className="w-5 h-5" />
                              <span>{t(item.translationKey)}</span>
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
                        {t("nav.reports")}
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
                              <SidebarMenuButton asChild isActive={isActive} tooltip={t(item.translationKey)}>
                                <NavLink to={item.path} className="pl-7">
                                  <Icon className="w-4 h-4" />
                                  <span>{t(item.translationKey)}</span>
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
            <LanguageSelector />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === "/settings"} tooltip={t("nav.settings")}>
              <NavLink to="/settings">
                <SettingsIcon className="w-5 h-5" />
                <span>{t("nav.settings")}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip={t("nav.logout")}>
              <LogOut className="w-5 h-5" />
              <span>{t("nav.logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export const Layout = ({ children }: LayoutProps) => {
  // Read initial state from cookie/localStorage to persist across page navigations
  const getInitialOpen = () => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/sidebar:state=(\w+)/);
      return match ? match[1] === 'true' : true;
    }
    return true;
  };

  return (
    <SidebarProvider defaultOpen={getInitialOpen()}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto bg-background">
          <div className="sticky top-0 z-10 flex h-14 items-center border-b bg-background px-4">
            <SidebarTrigger />
          </div>
          <div className="p-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
