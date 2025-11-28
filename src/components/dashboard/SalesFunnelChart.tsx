import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SalesFunnelData {
  id: string;
  year: number;
  month: number;
  stage: string;
  forecast_count: number;
  actual_count: number;
  forecast_value: number;
  actual_value: number;
  currency: string;
}

interface SalesFunnelChartProps {
  year?: number;
  month?: number;
}

export const SalesFunnelChart = ({ year: propYear, month: propMonth }: SalesFunnelChartProps) => {
  const currentDate = new Date();
  const [year, setYear] = useState(propYear || currentDate.getFullYear());
  const [month, setMonth] = useState(propMonth || currentDate.getMonth() + 1);
  const [funnelData, setFunnelData] = useState<SalesFunnelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const stageNames: Record<string, string> = {
    leads: "Leads",
    qualified: "Qualified",
    proposals: "Proposals",
    negotiations: "Negotiations",
    closed_won: "Closed Won",
    closed_lost: "Closed Lost",
  };

  const stageOrder = ['leads', 'qualified', 'proposals', 'negotiations', 'closed_won', 'closed_lost'];

  useEffect(() => {
    fetchFunnelData();
  }, [year, month]);

  const fetchFunnelData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("monthly_sales_funnel")
      .select("*")
      .eq("year", year)
      .eq("month", month)
      .order("stage", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load sales funnel data",
        variant: "destructive",
      });
    } else {
      // Create entries for all stages
      const allStages = stageOrder.map((stage) => {
        const existing = data?.find(r => r.stage === stage);
        return existing || {
          id: `temp-${stage}`,
          year,
          month,
          stage,
          forecast_count: 0,
          actual_count: 0,
          forecast_value: 0,
          actual_value: 0,
          currency: "PLN",
        };
      });
      setFunnelData(allStages);
    }
    setIsLoading(false);
  };

  const chartData = funnelData.map((data) => ({
    stage: stageNames[data.stage] || data.stage,
    "Forecast Count": data.forecast_count,
    "Actual Count": data.actual_count,
  }));

  const changeMonth = (delta: number) => {
    let newMonth = month + delta;
    let newYear = year;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    
    setMonth(newMonth);
    setYear(newYear);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Sales Funnel
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeMonth(-1)}
            >
              ←
            </Button>
            <span className="font-semibold min-w-[120px] text-center">
              {monthNames[month - 1]} {year}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeMonth(1)}
            >
              →
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis 
                type="category" 
                dataKey="stage" 
                width={120}
                className="text-xs"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Bar dataKey="Forecast Count" fill="hsl(var(--primary))" />
              <Bar dataKey="Actual Count" fill="hsl(var(--chart-2))" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
