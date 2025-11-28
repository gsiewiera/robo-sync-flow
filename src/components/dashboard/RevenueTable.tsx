import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, Edit, Check, X, TrendingUp, TrendingDown } from "lucide-react";

interface MonthlyRevenue {
  id: string;
  year: number;
  month: number;
  forecast_amount: number;
  actual_amount: number;
  currency: string;
}

interface RevenueTableProps {
  year?: number;
}

export const RevenueTable = ({ year: propYear }: RevenueTableProps) => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(propYear || currentYear);
  const [revenues, setRevenues] = useState<MonthlyRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ forecast: string; actual: string }>({ forecast: "", actual: "" });
  const [canEdit, setCanEdit] = useState(false);
  const { toast } = useToast();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    checkPermissions();
    fetchRevenues();
  }, [year]);

  const checkPermissions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasPermission = roles?.some(r => r.role === "admin" || r.role === "manager");
    setCanEdit(!!hasPermission);
  };

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

  const startEdit = (revenue: MonthlyRevenue, type: 'forecast' | 'actual') => {
    if (!canEdit) return;
    setEditingId(`${type}-${revenue.id}`);
    setEditValues({
      forecast: revenue.forecast_amount.toString(),
      actual: revenue.actual_amount.toString(),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ forecast: "", actual: "" });
  };

  const saveEdit = async (revenue: MonthlyRevenue) => {
    const forecast = parseFloat(editValues.forecast) || 0;
    const actual = parseFloat(editValues.actual) || 0;

    const { data: { user } } = await supabase.auth.getUser();

    try {
      if (revenue.id.startsWith("temp-")) {
        // Insert new record
        const { error } = await supabase
          .from("monthly_revenue")
          .insert({
            year,
            month: revenue.month,
            forecast_amount: forecast,
            actual_amount: actual,
            created_by: user?.id,
            updated_by: user?.id,
          });

        if (error) throw error;
      } else {
        // Update existing record - only update the field being edited
        const isEditingForecast = editingId?.startsWith('forecast');
        const updateData: any = { updated_by: user?.id };
        
        if (isEditingForecast) {
          updateData.forecast_amount = forecast;
        } else {
          updateData.actual_amount = actual;
        }
        
        const { error } = await supabase
          .from("monthly_revenue")
          .update(updateData)
          .eq("id", revenue.id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Revenue updated successfully",
      });

      fetchRevenues();
      setEditingId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save revenue data",
        variant: "destructive",
      });
    }
  };

  const calculateTotals = () => {
    return revenues.reduce(
      (acc, rev) => ({
        forecast: acc.forecast + rev.forecast_amount,
        actual: acc.actual + rev.actual_amount,
      }),
      { forecast: 0, actual: 0 }
    );
  };

  const calculateVariance = (forecast: number, actual: number) => {
    if (forecast === 0) return 0;
    return ((actual - forecast) / forecast) * 100;
  };

  const totals = calculateTotals();
  const totalVariance = calculateVariance(totals.forecast, totals.actual);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            Revenue Tracking
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
          <>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold w-32"></TableHead>
                    {revenues.map((revenue) => (
                      <TableHead key={revenue.id} className="text-center font-semibold min-w-[120px]">
                        {monthNames[revenue.month - 1]}
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-semibold min-w-[120px]">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Forecast Row */}
                  <TableRow>
                    <TableCell className="font-semibold">
                      <div className="flex items-center gap-2">
                        Forecast
                        {canEdit && editingId && editingId.startsWith('forecast') && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => saveEdit(revenues.find(r => r.id === editingId.replace('forecast-', ''))!)}
                            >
                              <Check className="w-4 h-4 text-success" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEdit}
                            >
                              <X className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {revenues.map((revenue) => {
                      const isEditing = editingId === `forecast-${revenue.id}`;
                      return (
                        <TableCell key={revenue.id} className="text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editValues.forecast}
                              onChange={(e) => setEditValues({ ...editValues, forecast: e.target.value })}
                              className="w-full"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => canEdit && startEdit(revenue, 'forecast')}
                              disabled={!canEdit}
                              className={canEdit ? "hover:bg-muted/50 px-2 py-1 rounded w-full" : "w-full"}
                            >
                              {revenue.forecast_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </button>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      {totals.forecast.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                  
                  {/* Actual Row */}
                  <TableRow>
                    <TableCell className="font-semibold">
                      <div className="flex items-center gap-2">
                        Actual
                        {canEdit && editingId && editingId.startsWith('actual') && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => saveEdit(revenues.find(r => r.id === editingId.replace('actual-', ''))!)}
                            >
                              <Check className="w-4 h-4 text-success" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEdit}
                            >
                              <X className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {revenues.map((revenue) => {
                      const isEditing = editingId === `actual-${revenue.id}`;
                      return (
                        <TableCell key={revenue.id} className="text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editValues.actual}
                              onChange={(e) => setEditValues({ ...editValues, actual: e.target.value })}
                              className="w-full"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => canEdit && startEdit(revenue, 'actual')}
                              disabled={!canEdit}
                              className={canEdit ? "hover:bg-muted/50 px-2 py-1 rounded w-full" : "w-full"}
                            >
                              {revenue.actual_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </button>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      {totals.actual.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                  
                  {/* Variance Row */}
                  <TableRow className="bg-muted/20">
                    <TableCell className="font-semibold">Variance</TableCell>
                    {revenues.map((revenue) => {
                      const variance = calculateVariance(revenue.forecast_amount, revenue.actual_amount);
                      return (
                        <TableCell key={revenue.id} className="text-center">
                          {revenue.forecast_amount > 0 && (
                            <div className="flex items-center justify-center gap-1">
                              {variance >= 0 ? (
                                <TrendingUp className="w-4 h-4 text-success" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-destructive" />
                              )}
                              <span className={variance >= 0 ? "text-success" : "text-destructive"}>
                                {variance.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      {totals.forecast > 0 && (
                        <div className="flex items-center justify-center gap-1">
                          {totalVariance >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-success" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-destructive" />
                          )}
                          <span className={totalVariance >= 0 ? "text-success" : "text-destructive"}>
                            {totalVariance.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            {!canEdit && (
              <p className="text-sm text-muted-foreground mt-4">
                Only managers and admins can edit revenue data
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};