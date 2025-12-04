import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bot, FileText, ShoppingCart, TrendingUp, Wrench, CalendarIcon, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { RobotsSoldChart } from "@/components/dashboard/RobotsSoldChart";
import { ServiceTicketsChart } from "@/components/dashboard/ServiceTicketsChart";
import { OpportunitiesChart } from "@/components/dashboard/OpportunitiesChart";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RevenueTable } from "@/components/dashboard/RevenueTable";
import { RobotsDeliveredChart } from "@/components/dashboard/RobotsDeliveredChart";
import { RobotsDeliveredTable } from "@/components/dashboard/RobotsDeliveredTable";
import { SalesFunnelChart } from "@/components/dashboard/SalesFunnelChart";
import { SalesFunnelTable } from "@/components/dashboard/SalesFunnelTable";
import { Skeleton } from "@/components/ui/skeleton";

type DateFilter = "this_month" | "last_month" | "ytd" | "custom";

interface DateRange {
  from: Date;
  to: Date;
}

interface Stats {
  openOpportunities: number;
  totalRobotsSold: number;
  robotsYTD: number;
  deployedRobots: number;
  totalServiceTickets: number;
  openTickets: number;
  closedTickets: number;
  implementedRobots: number;
  awaitingImplementation: number;
}

interface StatsWithChange extends Stats {
  changes: {
    openOpportunities: number;
    totalRobotsSold: number;
    robotsYTD: number;
    deployedRobots: number;
    totalServiceTickets: number;
    openTickets: number;
    closedTickets: number;
    implementedRobots: number;
    awaitingImplementation: number;
  };
}

interface ChartData {
  robotsSold: Array<{ date: string; count: number }>;
  serviceTickets: Array<{ date: string; open: number; closed: number }>;
  opportunities: Array<{ date: string; count: number }>;
}

const Dashboard = () => {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<DateFilter>("this_month");
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    from: new Date(),
    to: new Date(),
  });
  const [stats, setStats] = useState<StatsWithChange>({
    openOpportunities: 0,
    totalRobotsSold: 0,
    robotsYTD: 0,
    deployedRobots: 0,
    totalServiceTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    implementedRobots: 0,
    awaitingImplementation: 0,
    changes: {
      openOpportunities: 0,
      totalRobotsSold: 0,
      robotsYTD: 0,
      deployedRobots: 0,
      totalServiceTickets: 0,
      openTickets: 0,
      closedTickets: 0,
      implementedRobots: 0,
      awaitingImplementation: 0,
    },
  });
  const [chartData, setChartData] = useState<ChartData>({
    robotsSold: [],
    serviceTickets: [],
    opportunities: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const getDateRange = (): { start: string; end: string } => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (activeFilter) {
      case "this_month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "last_month":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "ytd":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case "custom":
        start = customDateRange.from;
        end = customDateRange.to;
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  const getPreviousDateRange = (): { start: string; end: string } => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (activeFilter) {
      case "this_month":
        // Previous month
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "last_month":
        // Month before last
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        end = new Date(now.getFullYear(), now.getMonth() - 1, 0);
        break;
      case "ytd":
        // Previous year same period
        const currentYearStart = new Date(now.getFullYear(), 0, 1);
        const dayOfYear = Math.floor((now.getTime() - currentYearStart.getTime()) / (1000 * 60 * 60 * 24));
        start = new Date(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear() - 1, 0, dayOfYear);
        break;
      case "custom":
        // Previous period of same length
        const duration = customDateRange.to.getTime() - customDateRange.from.getTime();
        end = new Date(customDateRange.from.getTime() - 1);
        start = new Date(end.getTime() - duration);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      const { start, end } = getDateRange();
      const { start: prevStart, end: prevEnd } = getPreviousDateRange();
      const startDate = new Date(start);
      const endDate = new Date(end);
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

      // Fetch current period stats
      // Fetch open opportunities (offers in proposal_sent or negotiation stage)
      const { count: openOpportunities } = await supabase
        .from("offers")
        .select("*", { count: "exact", head: true })
        .in("stage", ["proposal_sent", "negotiation"])
        .gte("created_at", start)
        .lte("created_at", end);

      // Fetch total robots sold
      const { count: totalRobotsSold } = await supabase
        .from("robots")
        .select("*", { count: "exact", head: true })
        .not("client_id", "is", null)
        .gte("delivery_date", start)
        .lte("delivery_date", end);

      // Fetch robots sold YTD
      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
      const { count: robotsYTD } = await supabase
        .from("robots")
        .select("*", { count: "exact", head: true })
        .not("client_id", "is", null)
        .gte("delivery_date", yearStart)
        .lte("delivery_date", end);

      // Fetch deployed robots
      const { count: deployedRobots } = await supabase
        .from("robots")
        .select("*", { count: "exact", head: true })
        .eq("status", "delivered")
        .gte("delivery_date", start)
        .lte("delivery_date", end);

      // Fetch service tickets stats
      const { count: totalServiceTickets } = await supabase
        .from("service_tickets")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start)
        .lte("created_at", end);

      const { count: openTickets } = await supabase
        .from("service_tickets")
        .select("*", { count: "exact", head: true })
        .in("status", ["open", "in_progress"])
        .gte("created_at", start)
        .lte("created_at", end);

      const { count: closedTickets } = await supabase
        .from("service_tickets")
        .select("*", { count: "exact", head: true })
        .in("status", ["resolved", "closed"])
        .gte("resolved_at", start)
        .lte("resolved_at", end);

      // Fetch implementation stats
      const { count: implementedRobots } = await supabase
        .from("robots")
        .select("*", { count: "exact", head: true })
        .in("status", ["delivered", "in_service"])
        .gte("delivery_date", start)
        .lte("delivery_date", end);

      const { count: awaitingImplementation } = await supabase
        .from("robots")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_warehouse")
        .not("client_id", "is", null)
        .gte("warehouse_intake_date", start)
        .lte("warehouse_intake_date", end);

      // Fetch previous period stats for comparison
      const { count: prevOpenOpportunities } = await supabase
        .from("offers")
        .select("*", { count: "exact", head: true })
        .in("stage", ["proposal_sent", "negotiation"])
        .gte("created_at", prevStart)
        .lte("created_at", prevEnd);

      const { count: prevTotalRobotsSold } = await supabase
        .from("robots")
        .select("*", { count: "exact", head: true })
        .not("client_id", "is", null)
        .gte("delivery_date", prevStart)
        .lte("delivery_date", prevEnd);

      const { count: prevDeployedRobots } = await supabase
        .from("robots")
        .select("*", { count: "exact", head: true })
        .eq("status", "delivered")
        .gte("delivery_date", prevStart)
        .lte("delivery_date", prevEnd);

      const { count: prevTotalServiceTickets } = await supabase
        .from("service_tickets")
        .select("*", { count: "exact", head: true })
        .gte("created_at", prevStart)
        .lte("created_at", prevEnd);

      const { count: prevOpenTickets } = await supabase
        .from("service_tickets")
        .select("*", { count: "exact", head: true })
        .in("status", ["open", "in_progress"])
        .gte("created_at", prevStart)
        .lte("created_at", prevEnd);

      const { count: prevClosedTickets } = await supabase
        .from("service_tickets")
        .select("*", { count: "exact", head: true })
        .in("status", ["resolved", "closed"])
        .gte("resolved_at", prevStart)
        .lte("resolved_at", prevEnd);

      const { count: prevImplementedRobots } = await supabase
        .from("robots")
        .select("*", { count: "exact", head: true })
        .in("status", ["delivered", "in_service"])
        .gte("delivery_date", prevStart)
        .lte("delivery_date", prevEnd);

      const { count: prevAwaitingImplementation } = await supabase
        .from("robots")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_warehouse")
        .not("client_id", "is", null)
        .gte("warehouse_intake_date", prevStart)
        .lte("warehouse_intake_date", prevEnd);

      const currentStats = {
        openOpportunities: openOpportunities || 0,
        totalRobotsSold: totalRobotsSold || 0,
        robotsYTD: robotsYTD || 0,
        deployedRobots: deployedRobots || 0,
        totalServiceTickets: totalServiceTickets || 0,
        openTickets: openTickets || 0,
        closedTickets: closedTickets || 0,
        implementedRobots: implementedRobots || 0,
        awaitingImplementation: awaitingImplementation || 0,
      };

      setStats({
        ...currentStats,
        changes: {
          openOpportunities: calculatePercentageChange(currentStats.openOpportunities, prevOpenOpportunities || 0),
          totalRobotsSold: calculatePercentageChange(currentStats.totalRobotsSold, prevTotalRobotsSold || 0),
          robotsYTD: calculatePercentageChange(currentStats.robotsYTD, robotsYTD || 0),
          deployedRobots: calculatePercentageChange(currentStats.deployedRobots, prevDeployedRobots || 0),
          totalServiceTickets: calculatePercentageChange(currentStats.totalServiceTickets, prevTotalServiceTickets || 0),
          openTickets: calculatePercentageChange(currentStats.openTickets, prevOpenTickets || 0),
          closedTickets: calculatePercentageChange(currentStats.closedTickets, prevClosedTickets || 0),
          implementedRobots: calculatePercentageChange(currentStats.implementedRobots, prevImplementedRobots || 0),
          awaitingImplementation: calculatePercentageChange(currentStats.awaitingImplementation, prevAwaitingImplementation || 0),
        },
      });

      // Fetch time-series data for charts
      const robotsSoldByDate = await Promise.all(
        dateRange.map(async (date) => {
          const dateStr = date.toISOString().split('T')[0];
          const { count } = await supabase
            .from("robots")
            .select("*", { count: "exact", head: true })
            .not("client_id", "is", null)
            .gte("delivery_date", dateStr)
            .lt("delivery_date", new Date(date.getTime() + 86400000).toISOString());
          return { date: dateStr, count: count || 0 };
        })
      );

      const serviceTicketsByDate = await Promise.all(
        dateRange.map(async (date) => {
          const dateStr = date.toISOString().split('T')[0];
          const nextDay = new Date(date.getTime() + 86400000).toISOString();
          
          const { count: openCount } = await supabase
            .from("service_tickets")
            .select("*", { count: "exact", head: true })
            .in("status", ["open", "in_progress"])
            .gte("created_at", dateStr)
            .lt("created_at", nextDay);

          const { count: closedCount } = await supabase
            .from("service_tickets")
            .select("*", { count: "exact", head: true })
            .in("status", ["resolved", "closed"])
            .gte("resolved_at", dateStr)
            .lt("resolved_at", nextDay);

          return { date: dateStr, open: openCount || 0, closed: closedCount || 0 };
        })
      );

      const opportunitiesByDate = await Promise.all(
        dateRange.map(async (date) => {
          const dateStr = date.toISOString().split('T')[0];
          const { count } = await supabase
            .from("offers")
            .select("*", { count: "exact", head: true })
            .in("stage", ["proposal_sent", "negotiation"])
            .gte("created_at", dateStr)
            .lt("created_at", new Date(date.getTime() + 86400000).toISOString());
          return { date: dateStr, count: count || 0 };
        })
      );

      setChartData({
        robotsSold: robotsSoldByDate,
        serviceTickets: serviceTicketsByDate,
        opportunities: opportunitiesByDate,
      });

      setIsLoading(false);
    };

    fetchStats();
  }, [activeFilter, customDateRange]);

  // Grouped stat cards for better organization
  const salesStats = [
    { title: "Open Opportunities", value: stats.openOpportunities, change: stats.changes.openOpportunities, icon: ShoppingCart, color: "text-primary" },
    { title: "Total Robots Sold", value: stats.totalRobotsSold, change: stats.changes.totalRobotsSold, icon: Bot, color: "text-success" },
    { title: "Robots Sold YTD", value: stats.robotsYTD, change: stats.changes.robotsYTD, icon: TrendingUp, color: "text-primary" },
  ];

  const deliveryStats = [
    { title: "Deployed Robots", value: stats.deployedRobots, change: stats.changes.deployedRobots, icon: Bot, color: "text-accent" },
    { title: "Implemented Robots", value: stats.implementedRobots, change: stats.changes.implementedRobots, icon: Bot, color: "text-success" },
    { title: "Awaiting Implementation", value: stats.awaitingImplementation, change: stats.changes.awaitingImplementation, icon: FileText, color: "text-warning" },
  ];

  const serviceStats = [
    { title: "Total Service Tickets", value: stats.totalServiceTickets, change: stats.changes.totalServiceTickets, icon: Wrench, color: "text-muted-foreground" },
    { title: "Open Tickets", value: stats.openTickets, change: stats.changes.openTickets, icon: Wrench, color: "text-warning" },
    { title: "Closed Tickets", value: stats.closedTickets, change: stats.changes.closedTickets, icon: Wrench, color: "text-success" },
  ];

  const renderStatCard = (stat: { title: string; value: number; change: number; icon: typeof Bot; color: string }) => {
    const Icon = stat.icon;
    const isPositive = stat.change >= 0;
    const ChangeIcon = isPositive ? ArrowUp : ArrowDown;
    const changeColor = isPositive ? "text-success" : "text-destructive";
    
    return (
      <Card key={stat.title} className="transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {stat.title}
          </CardTitle>
          <Icon className={cn("w-5 h-5", stat.color)} />
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className={cn("flex items-center gap-1 text-sm font-medium", changeColor)}>
              <ChangeIcon className="w-4 h-4" />
              <span>{Math.abs(stat.change).toFixed(1)}%</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">

        {/* Date Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeFilter === "this_month" ? "default" : "outline"}
            onClick={() => setActiveFilter("this_month")}
          >
            This Month
          </Button>
          <Button
            variant={activeFilter === "last_month" ? "default" : "outline"}
            onClick={() => setActiveFilter("last_month")}
          >
            Last Month
          </Button>
          <Button
            variant={activeFilter === "ytd" ? "default" : "outline"}
            onClick={() => setActiveFilter("ytd")}
          >
            YTD
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={activeFilter === "custom" ? "default" : "outline"}
                className={cn("justify-start text-left font-normal")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {activeFilter === "custom" ? (
                  <>
                    {format(customDateRange.from, "PP")} - {format(customDateRange.to, "PP")}
                  </>
                ) : (
                  "Custom Range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: customDateRange.from, to: customDateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setCustomDateRange({ from: range.from, to: range.to });
                    setActiveFilter("custom");
                  }
                }}
                initialFocus
                numberOfMonths={2}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Section 1: KPI Stats - Quick Overview */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Sales Pipeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {salesStats.map(renderStatCard)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Delivery & Operations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {deliveryStats.map(renderStatCard)}
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Service</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {serviceStats.map(renderStatCard)}
            </div>
          </div>
        </div>

        {/* Section 2: Sales Funnel - Core CRM View */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Sales Funnel</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalesFunnelChart />
            <SalesFunnelTable />
          </div>
        </div>

        {/* Section 3: Revenue Performance */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Revenue</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart />
            <RevenueTable />
          </div>
        </div>

        {/* Section 4: Delivery Performance */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Robots Delivered</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RobotsDeliveredChart />
            <RobotsDeliveredTable />
          </div>
        </div>

        {/* Section 5: Activity Charts - Detailed Time-Series */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Activity Trends</h2>
          {isLoading ? (
            <>
              <Skeleton className="h-[300px] w-full" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-[300px] w-full" />
                <Skeleton className="h-[300px] w-full" />
              </div>
            </>
          ) : (
            <>
              <RobotsSoldChart data={chartData.robotsSold} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OpportunitiesChart data={chartData.opportunities} />
                <ServiceTicketsChart data={chartData.serviceTickets} />
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
