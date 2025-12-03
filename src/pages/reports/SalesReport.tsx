import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, ShoppingCart, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const SalesReport = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<"month" | "quarter" | "year" | "all">("month");
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    offersCount: 0,
    wonDeals: 0,
    avgDealSize: 0,
    winRate: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSalesData();
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

  const fetchSalesData = async () => {
    setIsLoading(true);
    try {
      const startDate = getDateRange();

      // Fetch closed won deals
      const { data: wonData, error: wonError } = await supabase
        .from("offers")
        .select("total_price")
        .eq("stage", "closed_won")
        .gte("created_at", startDate);

      if (wonError) throw wonError;

      const totalRevenue = wonData?.reduce((sum, offer) => sum + (offer.total_price || 0), 0) || 0;
      const wonDeals = wonData?.length || 0;

      // Fetch all offers
      const { data: offersData } = await supabase
        .from("offers")
        .select("id, stage")
        .gte("created_at", startDate);

      const offersCount = offersData?.length || 0;

      // Calculate closed deals (won + lost)
      const { data: closedData } = await supabase
        .from("offers")
        .select("id")
        .in("stage", ["closed_won", "closed_lost"])
        .gte("created_at", startDate);

      const closedCount = closedData?.length || 0;
      const winRate = closedCount > 0 ? (wonDeals / closedCount) * 100 : 0;
      const avgDealSize = wonDeals > 0 ? totalRevenue / wonDeals : 0;

      setMetrics({
        totalRevenue,
        offersCount,
        wonDeals,
        avgDealSize,
        winRate,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load sales data",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-end">

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

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover-scale animate-fade-in bg-gradient-to-br from-success/5 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Total Revenue
                </CardTitle>
                <DollarSign className="w-5 h-5 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">
                  {metrics.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  PLN from closed deals
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale animate-fade-in bg-gradient-to-br from-primary/5 to-transparent" style={{ animationDelay: "100ms" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Total Offers
                </CardTitle>
                <ShoppingCart className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{metrics.offersCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Offers created
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale animate-fade-in bg-gradient-to-br from-chart-2/5 to-transparent" style={{ animationDelay: "200ms" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Won Deals
                </CardTitle>
                <TrendingUp className="w-5 h-5 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" style={{ color: "hsl(var(--chart-2))" }}>{metrics.wonDeals}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Successfully closed
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale animate-fade-in bg-gradient-to-br from-chart-3/5 to-transparent" style={{ animationDelay: "300ms" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Win Rate
                </CardTitle>
                <Target className="w-5 h-5 text-chart-3" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" style={{ color: "hsl(var(--chart-3))" }}>
                  {metrics.winRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Conversion rate
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="animate-fade-in shadow-xl" style={{ animationDelay: "400ms" }}>
          <CardHeader>
            <CardTitle>Sales Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm font-medium">Average Deal Size</span>
                <span className="text-lg font-bold text-success">
                  {metrics.avgDealSize.toLocaleString("en-US", { minimumFractionDigits: 0 })} PLN
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm font-medium">Revenue per Offer</span>
                <span className="text-lg font-bold">
                  {metrics.offersCount > 0 
                    ? (metrics.totalRevenue / metrics.offersCount).toLocaleString("en-US", { minimumFractionDigits: 0 })
                    : "0"
                  } PLN
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium">Conversion Rate</span>
                <span className="text-lg font-bold text-primary">
                  {metrics.offersCount > 0 
                    ? ((metrics.wonDeals / metrics.offersCount) * 100).toFixed(1)
                    : "0.0"
                  }%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SalesReport;
