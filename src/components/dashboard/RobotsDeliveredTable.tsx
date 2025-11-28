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
import { Bot, Check, X, TrendingUp, TrendingDown } from "lucide-react";

interface MonthlyRobotsDelivered {
  id: string;
  year: number;
  month: number;
  forecast_units: number;
  actual_units: number;
}

interface RobotsDeliveredTableProps {
  year?: number;
}

export const RobotsDeliveredTable = ({ year: propYear }: RobotsDeliveredTableProps) => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(propYear || currentYear);
  const [robotsDelivered, setRobotsDelivered] = useState<MonthlyRobotsDelivered[]>([]);
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
    fetchRobotsDelivered();
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

  const fetchRobotsDelivered = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("monthly_robots_delivered")
      .select("*")
      .eq("year", year)
      .order("month", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load robots delivered data",
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
          forecast_units: 0,
          actual_units: 0,
        };
      });
      setRobotsDelivered(allMonths);
    }
    setIsLoading(false);
  };

  const startEdit = (data: MonthlyRobotsDelivered, type: 'forecast' | 'actual') => {
    if (!canEdit) return;
    setEditingId(`${type}-${data.id}`);
    setEditValues({
      forecast: data.forecast_units.toString(),
      actual: data.actual_units.toString(),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ forecast: "", actual: "" });
  };

  const saveEdit = async (data: MonthlyRobotsDelivered) => {
    const forecast = parseInt(editValues.forecast) || 0;
    const actual = parseInt(editValues.actual) || 0;

    const { data: { user } } = await supabase.auth.getUser();

    try {
      if (data.id.startsWith("temp-")) {
        // Insert new record
        const { error } = await supabase
          .from("monthly_robots_delivered")
          .insert({
            year,
            month: data.month,
            forecast_units: forecast,
            actual_units: actual,
            created_by: user?.id,
            updated_by: user?.id,
          });

        if (error) throw error;
      } else {
        // Update existing record - only update the field being edited
        const isEditingForecast = editingId?.startsWith('forecast');
        const updateData: any = { updated_by: user?.id };
        
        if (isEditingForecast) {
          updateData.forecast_units = forecast;
        } else {
          updateData.actual_units = actual;
        }
        
        const { error } = await supabase
          .from("monthly_robots_delivered")
          .update(updateData)
          .eq("id", data.id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Robots delivered updated successfully",
      });

      fetchRobotsDelivered();
      setEditingId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save robots delivered data",
        variant: "destructive",
      });
    }
  };

  const calculateTotals = () => {
    return robotsDelivered.reduce(
      (acc, data) => ({
        forecast: acc.forecast + data.forecast_units,
        actual: acc.actual + data.actual_units,
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
            <Bot className="w-6 h-6 text-primary" />
            Robots Delivered Tracking
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
                    {robotsDelivered.map((data) => (
                      <TableHead key={data.id} className="text-center font-semibold min-w-[120px]">
                        {monthNames[data.month - 1]}
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
                              onClick={() => saveEdit(robotsDelivered.find(r => r.id === editingId.replace('forecast-', ''))!)}
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
                    {robotsDelivered.map((data) => {
                      const isEditing = editingId === `forecast-${data.id}`;
                      return (
                        <TableCell key={data.id} className="text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.forecast}
                              onChange={(e) => setEditValues({ ...editValues, forecast: e.target.value })}
                              className="w-full"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => canEdit && startEdit(data, 'forecast')}
                              disabled={!canEdit}
                              className={canEdit ? "hover:bg-muted/50 px-2 py-1 rounded w-full" : "w-full"}
                            >
                              {data.forecast_units}
                            </button>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      {totals.forecast}
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
                              onClick={() => saveEdit(robotsDelivered.find(r => r.id === editingId.replace('actual-', ''))!)}
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
                    {robotsDelivered.map((data) => {
                      const isEditing = editingId === `actual-${data.id}`;
                      return (
                        <TableCell key={data.id} className="text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.actual}
                              onChange={(e) => setEditValues({ ...editValues, actual: e.target.value })}
                              className="w-full"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => canEdit && startEdit(data, 'actual')}
                              disabled={!canEdit}
                              className={canEdit ? "hover:bg-muted/50 px-2 py-1 rounded w-full" : "w-full"}
                            >
                              {data.actual_units}
                            </button>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-semibold bg-muted/30">
                      {totals.actual}
                    </TableCell>
                  </TableRow>
                  
                  {/* Variance Row */}
                  <TableRow className="bg-muted/20">
                    <TableCell className="font-semibold">Variance</TableCell>
                    {robotsDelivered.map((data) => {
                      const variance = calculateVariance(data.forecast_units, data.actual_units);
                      return (
                        <TableCell key={data.id} className="text-center">
                          {data.forecast_units > 0 && (
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
                Only managers and admins can edit robots delivered data
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
