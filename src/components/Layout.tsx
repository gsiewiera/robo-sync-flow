import { ReactNode } from "react";
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
  Settings as SettingsIcon,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { NavLink } from "@/components/NavLink";
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
  { icon: Users, label: "Clients", path: "/clients" },
  { icon: FileText, label: "Contracts", path: "/contracts" },
  { icon: Wrench, label: "Service", path: "/service" },
  { icon: Bot, label: "Robots", path: "/robots" },
  { icon: DollarSign, label: "Pricing", path: "/pricing" },
];

function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon" className="w-32 data-[state=collapsed]:w-14">
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
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10 flex h-14 items-center border-b bg-background px-4">
            <SidebarTrigger />
          </div>
          <div className="container mx-auto p-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
