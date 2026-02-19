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
  TrendingUp,
  BarChart3,
  Activity,
  Building,
  CalendarClock,
  Receipt,
  UserPlus,
  Shield,
  Trophy,
  Target,
  StickyNote,
  UserCog,
  Cpu,
  Megaphone,
} from "lucide-react";

export interface NavItem {
  icon: any;
  label: string;
  translationKey: string;
  path: string;
  roles: string[];
}

export const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", translationKey: "nav.dashboard", path: "/dashboard", roles: ["admin", "manager", "salesperson", "technician"] },
  { icon: StickyNote, label: "Notes", translationKey: "nav.notes", path: "/notes", roles: ["admin", "manager", "salesperson"] },
  { icon: CheckSquare, label: "Tasks", translationKey: "nav.tasks", path: "/tasks", roles: ["admin", "manager", "salesperson", "technician"] },
  { icon: UserPlus, label: "Leads", translationKey: "nav.leads", path: "/leads", roles: ["admin", "manager", "salesperson"] },
  { icon: ShoppingCart, label: "Offers", translationKey: "nav.offers", path: "/offers", roles: ["admin", "manager", "salesperson"] },
  { icon: TrendingUp, label: "Funnel", translationKey: "nav.funnel", path: "/funnel", roles: ["admin", "manager"] },
  { icon: Users, label: "Clients", translationKey: "nav.clients", path: "/clients", roles: ["admin", "manager", "salesperson"] },
  { icon: Megaphone, label: "Campaigns", translationKey: "nav.campaigns", path: "/campaigns", roles: ["admin", "manager", "salesperson"] },
  { icon: Building2, label: "Resellers", translationKey: "nav.resellers", path: "/resellers", roles: ["admin", "manager", "salesperson"] },
  { icon: FileText, label: "Contracts", translationKey: "nav.contracts", path: "/contracts", roles: ["admin", "manager", "salesperson"] },
  { icon: Receipt, label: "Invoices", translationKey: "nav.invoices", path: "/invoices", roles: ["admin", "manager", "salesperson"] },
  { icon: Wrench, label: "Service", translationKey: "nav.service", path: "/service", roles: ["admin", "manager", "technician"] },
  { icon: Bot, label: "Robots", translationKey: "nav.robots", path: "/robots", roles: ["admin", "manager", "technician"] },
  { icon: Cpu, label: "Robot Models", translationKey: "nav.robotModels", path: "/robot-models", roles: ["admin", "manager"] },
  { icon: Package, label: "Items", translationKey: "nav.items", path: "/items", roles: ["admin", "manager"] },
  { icon: DollarSign, label: "Pricing", translationKey: "nav.pricing", path: "/pricing", roles: ["admin", "manager"] },
  { icon: Trophy, label: "Leaderboard", translationKey: "nav.leaderboard", path: "/leaderboard", roles: ["admin", "manager"] },
  { icon: Target, label: "Goals", translationKey: "nav.goals", path: "/goals", roles: ["admin", "manager"] },
  { icon: UserCog, label: "Salesperson Panel", translationKey: "nav.salespersonPanel", path: "/admin/salesperson-panel", roles: ["admin"] },
  { icon: Shield, label: "Admin", translationKey: "nav.admin", path: "/admin/users", roles: ["admin"] },
];

export const reportNavItems: NavItem[] = [
  { icon: Activity, label: "Activity", translationKey: "reports.activity", path: "/reports/activity", roles: ["admin", "manager"] },
  { icon: BarChart3, label: "Sales", translationKey: "reports.sales", path: "/reports/sales", roles: ["admin", "manager"] },
  { icon: Building, label: "Reseller", translationKey: "reports.reseller", path: "/reports/reseller", roles: ["admin", "manager"] },
  { icon: CalendarClock, label: "Ending", translationKey: "reports.ending", path: "/reports/ending", roles: ["admin", "manager"] },
];

export const filterNavByRoles = (items: NavItem[], userRoles: string[]) =>
  items.filter((item) => item.roles.some((role) => userRoles.includes(role)));
