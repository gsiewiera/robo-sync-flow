import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MonthlyRevenue {
  id: string;
  year: number;
  month: number;
  forecast_amount: number;
  actual_amount: number;
  currency: string;
}

interface RevenueChartProps {
  year?: number;
  chartType?: "line" | "bar";
}

export const RevenueChart = ({ year: propYear, chartType = "line" }: RevenueChartProps) => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(propYear || currentYear);
  const [revenues, setRevenues] = useState<MonthlyRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  useEffect(() => {
    fetchRevenues();
  }, [year]);

  const fetchRevenues = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("monthly_revenue")
      .select("*")
      .eq("year", year)
      .order("month", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load revenue data",
        variant: "destructive",
      });
    } else {
      // Create entries for all 12 months
      const allMonths = Array.from({ length: 12 }, (_, i) => {
        const existing = data?.find(r => r.month === i + 1);
        return existing || {
          id: `temp-${i}`,
          year,
          month: i + 1,
          forecast_amount: 0,
          actual_amount: 0,
          currency: "PLN",
        };
      });
      setRevenues(allMonths);
    }
    setIsLoading(false);
  };

  const chartData = revenues.map((revenue) => ({
    month: monthNames[revenue.month - 1],
    Forecast: revenue.forecast_amount,
    Actual: revenue.actual_amount,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const ChartComponent = chartType === "line" ? LineChart : BarChart;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Revenue Trends
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setYear(year - 1)}
            >
              {year - 1}
            </Button>
            <span className="font-semibold">{year}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setYear(year + 1)}
            >
              {year + 1}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <ChartComponent data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
              />
              <YAxis 
                tickFormatter={formatCurrency}
                className="text-xs"
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value) + " PLN"}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              {chartType === "line" ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="Forecast"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Actual"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </>
              ) : (
                <>
                  <Bar dataKey="Forecast" fill="hsl(var(--primary))" />
                  <Bar dataKey="Actual" fill="hsl(var(--chart-2))" />
                </>
              )}
            </ChartComponent>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
