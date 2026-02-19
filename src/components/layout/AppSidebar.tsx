import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Settings as SettingsIcon, LogOut, BarChart3, ChevronDown } from "lucide-react";
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
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { LanguageSelector } from "@/components/LanguageSelector";
import { mainNavItems, reportNavItems, filterNavByRoles } from "@/config/navigation";
import { useUserRoles } from "@/hooks/use-user-roles";
import { useCompanyLogo } from "@/hooks/use-company-logo";

export function AppSidebar() {
  const { open } = useSidebar();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [reportsOpen, setReportsOpen] = useState(location.pathname.startsWith("/reports"));
  const reportsRef = useRef<HTMLDivElement>(null);
  const { userRoles, loading: rolesLoading } = useUserRoles();
  const companyLogo = useCompanyLogo();

  const navItems = filterNavByRoles(mainNavItems, userRoles);
  const filteredReportItems = filterNavByRoles(reportNavItems, userRoles);

  const handleReportsToggle = (open: boolean) => {
    setReportsOpen(open);
    if (open && reportsRef.current) {
      setTimeout(() => {
        reportsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  };

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
          {open && companyLogo && (
            <img
              src={companyLogo}
              alt="Company Logo"
              className="mt-2 max-h-10 object-contain"
            />
          )}
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
