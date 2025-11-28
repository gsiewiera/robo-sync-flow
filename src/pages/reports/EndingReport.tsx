import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, FileText, Calendar, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface EndingContract {
  id: string;
  contract_number: string;
  client_name: string;
  end_date: string;
  monthly_payment: number;
  daysUntilEnd: number;
}

const EndingReport = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [contracts, setContracts] = useState<EndingContract[]>([]);
  const [metrics, setMetrics] = useState({
    ending30Days: 0,
    ending60Days: 0,
    ending90Days: 0,
    totalAtRisk: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEndingContracts();
  }, []);

  const fetchEndingContracts = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      // Fetch contracts ending within 90 days
      const { data: contractsData, error: contractsError } = await supabase
        .from("contracts")
        .select(`
          id,
          contract_number,
          end_date,
          monthly_payment,
          client:clients(name)
        `)
        .eq("status", "active")
        .not("end_date", "is", null)
        .lte("end_date", in90Days.toISOString().split('T')[0])
        .order("end_date", { ascending: true });

      if (contractsError) throw contractsError;

      const endingContracts: EndingContract[] = (contractsData || []).map((contract: any) => {
        const endDate = new Date(contract.end_date);
        const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: contract.id,
          contract_number: contract.contract_number,
          client_name: contract.client?.name || "Unknown",
          end_date: contract.end_date,
          monthly_payment: contract.monthly_payment || 0,
          daysUntilEnd,
        };
      });

      const ending30 = endingContracts.filter((c) => c.daysUntilEnd <= 30).length;
      const ending60 = endingContracts.filter((c) => c.daysUntilEnd > 30 && c.daysUntilEnd <= 60).length;
      const ending90 = endingContracts.filter((c) => c.daysUntilEnd > 60 && c.daysUntilEnd <= 90).length;
      const totalAtRisk = endingContracts.reduce((sum, c) => sum + c.monthly_payment, 0);

      setContracts(endingContracts);
      setMetrics({
        ending30Days: ending30,
        ending60Days: ending60,
        ending90Days: ending90,
        totalAtRisk,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load ending contracts",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyBadge = (days: number) => {
    if (days <= 30) return <Badge className="bg-destructive">Critical</Badge>;
    if (days <= 60) return <Badge className="bg-warning text-warning-foreground">Warning</Badge>;
    return <Badge className="bg-chart-3">Attention</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ending Contracts Report</h1>
          <p className="text-muted-foreground">Monitor contracts nearing expiration</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="hover-scale animate-fade-in bg-gradient-to-br from-destructive/5 to-transparent border-destructive/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Next 30 Days
                </CardTitle>
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">{metrics.ending30Days}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Critical contracts
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale animate-fade-in bg-gradient-to-br from-warning/5 to-transparent" style={{ animationDelay: "100ms" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  31-60 Days
                </CardTitle>
                <Calendar className="w-5 h-5 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warning">{metrics.ending60Days}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Needs attention
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale animate-fade-in bg-gradient-to-br from-chart-3/5 to-transparent" style={{ animationDelay: "200ms" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  61-90 Days
                </CardTitle>
                <FileText className="w-5 h-5 text-chart-3" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" style={{ color: "hsl(var(--chart-3))" }}>{metrics.ending90Days}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Monitor closely
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale animate-fade-in bg-gradient-to-br from-primary/5 to-transparent" style={{ animationDelay: "300ms" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Revenue at Risk
                </CardTitle>
                <TrendingDown className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {metrics.totalAtRisk.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  PLN monthly
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="animate-fade-in shadow-xl" style={{ animationDelay: "400ms" }}>
          <CardHeader>
            <CardTitle>Expiring Contracts</CardTitle>
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
                    <TableHead>Contract Number</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-right">Monthly Payment</TableHead>
                    <TableHead className="text-right">Days Until End</TableHead>
                    <TableHead className="text-right">Urgency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{contract.contract_number}</TableCell>
                      <TableCell>{contract.client_name}</TableCell>
                      <TableCell>{new Date(contract.end_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {contract.monthly_payment.toLocaleString("en-US", { minimumFractionDigits: 0 })} PLN
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {contract.daysUntilEnd} days
                      </TableCell>
                      <TableCell className="text-right">
                        {getUrgencyBadge(contract.daysUntilEnd)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {contracts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No contracts ending in the next 90 days
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

export default EndingReport;
