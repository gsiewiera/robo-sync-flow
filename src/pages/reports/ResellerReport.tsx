import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, TrendingUp, Users, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ResellerMetrics {
  id: string;
  name: string;
  clientCount: number;
  offerCount: number;
  totalRevenue: number;
}

const ResellerReport = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<"month" | "quarter" | "year" | "all">("month");
  const [resellers, setResellers] = useState<ResellerMetrics[]>([]);
  const [totals, setTotals] = useState({
    totalResellers: 0,
    totalClients: 0,
    totalRevenue: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchResellerData();
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

  const fetchResellerData = async () => {
    setIsLoading(true);
    try {
      const startDate = getDateRange();

      // Fetch all resellers
      const { data: resellersData, error: resellersError } = await supabase
        .from("resellers")
        .select("id, name")
        .eq("status", "active");

      if (resellersError) throw resellersError;

      const resellerMetrics: ResellerMetrics[] = [];
      let totalClients = 0;
      let totalRevenue = 0;

      for (const reseller of resellersData || []) {
        // Count clients for this reseller
        const { data: clientsData } = await supabase
          .from("clients")
          .select("id")
          .eq("reseller_id", reseller.id);

        const clientCount = clientsData?.length || 0;
        totalClients += clientCount;

        // Count offers for this reseller
        const { data: offersData } = await supabase
          .from("offers")
          .select("total_price, stage")
          .eq("reseller_id", reseller.id)
          .gte("created_at", startDate);

        const offerCount = offersData?.length || 0;

        // Calculate revenue from closed won deals
        const revenue = offersData
          ?.filter((o) => o.stage === "closed_won")
          .reduce((sum, offer) => sum + (offer.total_price || 0), 0) || 0;

        totalRevenue += revenue;

        resellerMetrics.push({
          id: reseller.id,
          name: reseller.name,
          clientCount,
          offerCount,
          totalRevenue: revenue,
        });
      }

      // Sort by revenue descending
      resellerMetrics.sort((a, b) => b.totalRevenue - a.totalRevenue);

      setResellers(resellerMetrics);
      setTotals({
        totalResellers: resellersData?.length || 0,
        totalClients,
        totalRevenue,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load reseller data",
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reseller Report</h1>
            <p className="text-muted-foreground">Partner performance and contribution metrics</p>
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

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover-scale animate-fade-in bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Active Resellers
                </CardTitle>
                <Building2 className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{totals.totalResellers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Partner organizations
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale animate-fade-in bg-gradient-to-br from-chart-2/5 to-transparent" style={{ animationDelay: "100ms" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Total Clients
                </CardTitle>
                <Users className="w-5 h-5 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" style={{ color: "hsl(var(--chart-2))" }}>{totals.totalClients}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Through resellers
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale animate-fade-in bg-gradient-to-br from-success/5 to-transparent" style={{ animationDelay: "200ms" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Total Revenue
                </CardTitle>
                <DollarSign className="w-5 h-5 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">
                  {totals.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  PLN from partners
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="animate-fade-in shadow-xl" style={{ animationDelay: "300ms" }}>
          <CardHeader>
            <CardTitle>Reseller Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reseller Name</TableHead>
                    <TableHead className="text-right">Clients</TableHead>
                    <TableHead className="text-right">Offers</TableHead>
                    <TableHead className="text-right">Revenue (PLN)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resellers.map((reseller) => (
                    <TableRow key={reseller.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{reseller.name}</TableCell>
                      <TableCell className="text-right">{reseller.clientCount}</TableCell>
                      <TableCell className="text-right">{reseller.offerCount}</TableCell>
                      <TableCell className="text-right font-semibold text-success">
                        {reseller.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {resellers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No reseller data available for this period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ResellerReport;
