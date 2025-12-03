import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity, Users, Calendar, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const ActivityReport = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<"week" | "month" | "quarter" | "year">("month");
  const [metrics, setMetrics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalMeetings: 0,
    totalCalls: 0,
    activeUsers: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchActivityData();
  }, [dateFilter]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;

    switch (dateFilter) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return startDate.toISOString();
  };

  const fetchActivityData = async () => {
    setIsLoading(true);
    try {
      const startDate = getDateRange();

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("status")
        .gte("created_at", startDate);

      if (tasksError) throw tasksError;

      const totalTasks = tasksData?.length || 0;
      const completedTasks = tasksData?.filter((t) => t.status === "completed").length || 0;

      // Count meetings and calls
      const { data: meetingsData } = await supabase
        .from("tasks")
        .select("meeting_type, call_attempted")
        .gte("created_at", startDate);

      const totalMeetings = meetingsData?.filter((t) => t.meeting_type).length || 0;
      const totalCalls = meetingsData?.filter((t) => t.call_attempted).length || 0;

      // Get active users
      const { data: usersData } = await supabase
        .from("profiles")
        .select("id");

      setMetrics({
        totalTasks,
        completedTasks,
        totalMeetings,
        totalCalls,
        activeUsers: usersData?.length || 0,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load activity data",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const completionRate = metrics.totalTasks > 0 
    ? ((metrics.completedTasks / metrics.totalTasks) * 100).toFixed(1)
    : "0.0";

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-end">

          <div className="flex gap-2">
            <Button
              variant={dateFilter === "week" ? "default" : "outline"}
              onClick={() => setDateFilter("week")}
              size="sm"
            >
              This Week
            </Button>
            <Button
              variant={dateFilter === "month" ? "default" : "outline"}
              onClick={() => setDateFilter("month")}
              size="sm"
            >
              This Month
            </Button>
            <Button
              variant={dateFilter === "quarter" ? "default" : "outline"}
              onClick={() => setDateFilter("quarter")}
              size="sm"
            >
              This Quarter
            </Button>
            <Button
              variant={dateFilter === "year" ? "default" : "outline"}
              onClick={() => setDateFilter("year")}
              size="sm"
            >
              This Year
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover-scale animate-fade-in bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Total Tasks
                </CardTitle>
                <Activity className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{metrics.totalTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.completedTasks} completed ({completionRate}%)
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale animate-fade-in bg-gradient-to-br from-success/5 to-transparent" style={{ animationDelay: "100ms" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Meetings
                </CardTitle>
                <Calendar className="w-5 h-5 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">{metrics.totalMeetings}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Scheduled and completed
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale animate-fade-in bg-gradient-to-br from-chart-3/5 to-transparent" style={{ animationDelay: "200ms" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Calls Made
                </CardTitle>
                <TrendingUp className="w-5 h-5 text-chart-3" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" style={{ color: "hsl(var(--chart-3))" }}>{metrics.totalCalls}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Call attempts tracked
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale animate-fade-in bg-gradient-to-br from-chart-2/5 to-transparent" style={{ animationDelay: "300ms" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Active Users
                </CardTitle>
                <Users className="w-5 h-5 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" style={{ color: "hsl(var(--chart-2))" }}>{metrics.activeUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Team members
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="animate-fade-in shadow-xl" style={{ animationDelay: "400ms" }}>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm font-medium">Task Completion Rate</span>
                <span className="text-lg font-bold text-primary">{completionRate}%</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm font-medium">Average Tasks per User</span>
                <span className="text-lg font-bold">
                  {metrics.activeUsers > 0 ? (metrics.totalTasks / metrics.activeUsers).toFixed(1) : "0.0"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium">Meetings per Week</span>
                <span className="text-lg font-bold text-success">
                  {dateFilter === "week" ? metrics.totalMeetings : (metrics.totalMeetings / 4).toFixed(1)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ActivityReport;
