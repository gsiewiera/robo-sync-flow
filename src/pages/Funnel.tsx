import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, DollarSign, Target } from "lucide-react";
import { FunnelVisualization } from "@/components/funnel/FunnelVisualization";

interface FunnelMetrics {
  leads: { count: number; value: number };
  qualified: { count: number; value: number };
  proposal_sent: { count: number; value: number };
  negotiation: { count: number; value: number };
  closed_won: { count: number; value: number };
  closed_lost: { count: number; value: number };
}

const Funnel = () => {
  const [metrics, setMetrics] = useState<FunnelMetrics>({
    leads: { count: 0, value: 0 },
    qualified: { count: 0, value: 0 },
    proposal_sent: { count: 0, value: 0 },
    negotiation: { count: 0, value: 0 },
    closed_won: { count: 0, value: 0 },
    closed_lost: { count: 0, value: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<"month" | "quarter" | "year" | "all">("month");
  const { toast } = useToast();

  useEffect(() => {
    fetchFunnelData();
  }, [dateFilter]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;

    switch (dateFilter) {
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
      case "all":
        startDate = new Date(2000, 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return startDate.toISOString();
  };

  const fetchFunnelData = async () => {
    setIsLoading(true);
    try {
      const startDate = getDateRange();

      // Fetch offers grouped by stage
      const stages = ['leads', 'qualified', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost'];
      const results: FunnelMetrics = {
        leads: { count: 0, value: 0 },
        qualified: { count: 0, value: 0 },
        proposal_sent: { count: 0, value: 0 },
        negotiation: { count: 0, value: 0 },
        closed_won: { count: 0, value: 0 },
        closed_lost: { count: 0, value: 0 },
      };

      for (const stage of stages) {
        const { data, error } = await supabase
          .from("offers")
          .select("total_price")
          .eq("stage", stage)
          .gte("created_at", startDate);

        if (error) throw error;

        results[stage as keyof FunnelMetrics] = {
          count: data?.length || 0,
          value: data?.reduce((sum, offer) => sum + (offer.total_price || 0), 0) || 0,
        };
      }

      setMetrics(results);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load funnel data",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const stageColors = {
    leads: "hsl(var(--chart-1))",
    qualified: "hsl(var(--chart-2))",
    proposal_sent: "hsl(var(--chart-3))",
    negotiation: "hsl(var(--chart-4))",
    closed_won: "hsl(var(--success))",
    closed_lost: "hsl(var(--destructive))",
  };

  const funnelStages = [
    { name: "Leads", count: metrics.leads.count, value: metrics.leads.value, color: stageColors.leads },
    { name: "Qualified", count: metrics.qualified.count, value: metrics.qualified.value, color: stageColors.qualified },
    { name: "Proposal Sent", count: metrics.proposal_sent.count, value: metrics.proposal_sent.value, color: stageColors.proposal_sent },
    { name: "In Negotiation", count: metrics.negotiation.count, value: metrics.negotiation.value, color: stageColors.negotiation },
    { name: "Closed Won", count: metrics.closed_won.count, value: metrics.closed_won.value, color: stageColors.closed_won },
  ];

  const totalPipeline = Object.values(metrics)
    .filter((_, i) => i < 4) // Exclude closed_won and closed_lost
    .reduce((sum, stage) => sum + stage.value, 0);

  const winRate = metrics.closed_won.count + metrics.closed_lost.count > 0
    ? ((metrics.closed_won.count / (metrics.closed_won.count + metrics.closed_lost.count)) * 100).toFixed(1)
    : "0.0";

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sales Funnel</h1>
            <p className="text-muted-foreground">Track your sales pipeline and conversion rates</p>
          </div>

          <div className="flex gap-2">
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
            <Button
              variant={dateFilter === "all" ? "default" : "outline"}
              onClick={() => setDateFilter("all")}
              size="sm"
            >
              All Time
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pipeline Value
              </CardTitle>
              <DollarSign className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {totalPipeline.toLocaleString("en-US", { minimumFractionDigits: 0 })} PLN
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active opportunities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Win Rate
              </CardTitle>
              <Target className="w-5 h-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {winRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.closed_won.count} won / {metrics.closed_won.count + metrics.closed_lost.count} closed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenue Generated
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {metrics.closed_won.value.toLocaleString("en-US", { minimumFractionDigits: 0 })} PLN
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From closed deals
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Funnel Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Pipeline Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <FunnelVisualization stages={funnelStages} />
            )}
          </CardContent>
        </Card>

        {/* Lost Deals */}
        {metrics.closed_lost.count > 0 && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Closed Lost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{metrics.closed_lost.count} deals</div>
                  <div className="text-muted-foreground">
                    {metrics.closed_lost.value.toLocaleString("en-US", { minimumFractionDigits: 0 })} PLN lost value
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Funnel;
