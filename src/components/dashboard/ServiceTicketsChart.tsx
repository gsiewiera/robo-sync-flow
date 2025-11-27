import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface DataPoint {
  date: string;
  open: number;
  closed: number;
}

interface ServiceTicketsChartProps {
  data: DataPoint[];
}

export const ServiceTicketsChart = ({ data }: ServiceTicketsChartProps) => {
  const chartConfig = {
    open: {
      label: "Open Tickets",
      color: "hsl(var(--warning))",
    },
    closed: {
      label: "Closed Tickets",
      color: "hsl(var(--success))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Tickets Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(new Date(value), "MMM d")}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area 
                type="monotone" 
                dataKey="open" 
                stackId="1"
                stroke="hsl(var(--warning))" 
                fill="hsl(var(--warning) / 0.3)"
              />
              <Area 
                type="monotone" 
                dataKey="closed" 
                stackId="1"
                stroke="hsl(var(--success))" 
                fill="hsl(var(--success) / 0.3)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
