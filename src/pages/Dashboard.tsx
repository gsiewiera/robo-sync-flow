import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bot, FileText, ShoppingCart, TrendingUp, Wrench, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

const Dashboard = () => {
  const [activeFilter, setActiveFilter] = useState<DateFilter>("this_month");
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    from: new Date(),
    to: new Date(),
  });
  const [stats, setStats] = useState<Stats>({
    openOpportunities: 0,
    totalRobotsSold: 0,
    robotsYTD: 0,
    deployedRobots: 0,
    totalServiceTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    implementedRobots: 0,
    awaitingImplementation: 0,
  });

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

  useEffect(() => {
    const fetchStats = async () => {
      const { start, end } = getDateRange();

      // Fetch open opportunities (offers in sent status)
      const { count: openOpportunities } = await supabase
        .from("offers")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent")
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

      setStats({
        openOpportunities: openOpportunities || 0,
        totalRobotsSold: totalRobotsSold || 0,
        robotsYTD: robotsYTD || 0,
        deployedRobots: deployedRobots || 0,
        totalServiceTickets: totalServiceTickets || 0,
        openTickets: openTickets || 0,
        closedTickets: closedTickets || 0,
        implementedRobots: implementedRobots || 0,
        awaitingImplementation: awaitingImplementation || 0,
      });
    };

    fetchStats();
  }, [activeFilter, customDateRange]);

  const statCards = [
    { title: "Open Opportunities", value: stats.openOpportunities, icon: ShoppingCart, color: "text-primary" },
    { title: "Total Robots Sold", value: stats.totalRobotsSold, icon: Bot, color: "text-success" },
    { title: "Robots Sold YTD", value: stats.robotsYTD, icon: TrendingUp, color: "text-primary" },
    { title: "Deployed Robots", value: stats.deployedRobots, icon: Bot, color: "text-accent" },
    { title: "Total Service Tickets", value: stats.totalServiceTickets, icon: Wrench, color: "text-muted-foreground" },
    { title: "Open Tickets", value: stats.openTickets, icon: Wrench, color: "text-warning" },
    { title: "Closed Tickets", value: stats.closedTickets, icon: Wrench, color: "text-success" },
    { title: "Implemented Robots", value: stats.implementedRobots, icon: Bot, color: "text-success" },
    { title: "Awaiting Implementation", value: stats.awaitingImplementation, icon: FileText, color: "text-warning" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your RoboCRM overview</p>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="transition-shadow hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={cn("w-5 h-5", stat.color)} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
