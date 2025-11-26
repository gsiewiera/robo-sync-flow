import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, FileText, ShoppingCart, TrendingUp, Wrench, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch open opportunities (offers in sent status)
      const { count: openOpportunities } = await supabase
        .from("offers")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent");

      // Fetch total robots sold
      const { count: totalRobotsSold } = await supabase
        .from("robots")
        .select("*", { count: "exact", head: true })
        .not("client_id", "is", null);

      // Fetch robots sold YTD
      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
      const { count: robotsYTD } = await supabase
        .from("robots")
        .select("*", { count: "exact", head: true })
        .not("client_id", "is", null)
        .gte("delivery_date", yearStart);

      // Fetch deployed robots
      const { count: deployedRobots } = await supabase
        .from("robots")
        .select("*", { count: "exact", head: true })
        .eq("status", "delivered");

      // Fetch service tickets stats
      const { count: totalServiceTickets } = await supabase
        .from("service_tickets")
        .select("*", { count: "exact", head: true });

      const { count: openTickets } = await supabase
        .from("service_tickets")
        .select("*", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]);

      const { count: closedTickets } = await supabase
        .from("service_tickets")
        .select("*", { count: "exact", head: true })
        .in("status", ["resolved", "closed"]);

      // Fetch implementation stats
      const { count: implementedRobots } = await supabase
        .from("robots")
        .select("*", { count: "exact", head: true })
        .in("status", ["delivered", "in_service"]);

      const { count: awaitingImplementation } = await supabase
        .from("robots")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_warehouse")
        .not("client_id", "is", null);

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
  }, []);

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

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
