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
import { TrendingUp, Edit, Check, X } from "lucide-react";

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

interface SalesFunnelTableProps {
  year?: number;
  month?: number;
}

export const SalesFunnelTable = ({ year: propYear, month: propMonth }: SalesFunnelTableProps) => {
  const currentDate = new Date();
  const [year, setYear] = useState(propYear || currentDate.getFullYear());
  const [month, setMonth] = useState(propMonth || currentDate.getMonth() + 1);
  const [funnelData, setFunnelData] = useState<SalesFunnelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    forecast_count: "",
    actual_count: "",
    forecast_value: "",
    actual_value: "",
  });
  const [canEdit, setCanEdit] = useState(false);
  const { toast } = useToast();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const stageNames: Record<string, string> = {
    leads: "Leads",
    qualified: "Qualified",
    proposals: "Proposals Sent",
    negotiations: "In Negotiation",
    closed_won: "Closed Won",
    closed_lost: "Closed Lost",
  };

  const stageOrder = ['leads', 'qualified', 'proposals', 'negotiations', 'closed_won', 'closed_lost'];

  useEffect(() => {
    checkPermissions();
    fetchFunnelData();
  }, [year, month]);

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

  const fetchFunnelData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("monthly_sales_funnel")
      .select("*")
      .eq("year", year)
      .eq("month", month);

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

  const startEdit = (data: SalesFunnelData) => {
    if (!canEdit) return;
    setEditingId(data.id);
    setEditValues({
      forecast_count: data.forecast_count.toString(),
      actual_count: data.actual_count.toString(),
      forecast_value: data.forecast_value.toString(),
      actual_value: data.actual_value.toString(),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({
      forecast_count: "",
      actual_count: "",
      forecast_value: "",
      actual_value: "",
    });
  };

  const saveEdit = async (data: SalesFunnelData) => {
    const forecastCount = parseInt(editValues.forecast_count) || 0;
    const actualCount = parseInt(editValues.actual_count) || 0;
    const forecastValue = parseFloat(editValues.forecast_value) || 0;
    const actualValue = parseFloat(editValues.actual_value) || 0;

    const { data: { user } } = await supabase.auth.getUser();

    try {
      if (data.id.startsWith("temp-")) {
        // Insert new record
        const { error } = await supabase
          .from("monthly_sales_funnel")
          .insert({
            year,
            month,
            stage: data.stage,
            forecast_count: forecastCount,
            actual_count: actualCount,
            forecast_value: forecastValue,
            actual_value: actualValue,
            created_by: user?.id,
            updated_by: user?.id,
          });

        if (error) throw error;
      } else {
        // Update existing record
        const { error } = await supabase
          .from("monthly_sales_funnel")
          .update({
            forecast_count: forecastCount,
            actual_count: actualCount,
            forecast_value: forecastValue,
            actual_value: actualValue,
            updated_by: user?.id,
          })
          .eq("id", data.id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Sales funnel updated successfully",
      });

      fetchFunnelData();
      setEditingId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save sales funnel data",
        variant: "destructive",
      });
    }
  };

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
            Sales Funnel Tracking
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
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Stage</TableHead>
                    <TableHead className="text-right font-semibold">Forecast Count</TableHead>
                    <TableHead className="text-right font-semibold">Actual Count</TableHead>
                    <TableHead className="text-right font-semibold">Forecast Value (PLN)</TableHead>
                    <TableHead className="text-right font-semibold">Actual Value (PLN)</TableHead>
                    {canEdit && <TableHead className="w-20"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funnelData.map((data) => {
                    const isEditing = editingId === data.id;
                    
                    return (
                      <TableRow key={data.id}>
                        <TableCell className="font-medium">
                          {stageNames[data.stage] || data.stage}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.forecast_count}
                              onChange={(e) => setEditValues({ ...editValues, forecast_count: e.target.value })}
                              className="w-24 ml-auto"
                            />
                          ) : (
                            data.forecast_count
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.actual_count}
                              onChange={(e) => setEditValues({ ...editValues, actual_count: e.target.value })}
                              className="w-24 ml-auto"
                            />
                          ) : (
                            data.actual_count
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editValues.forecast_value}
                              onChange={(e) => setEditValues({ ...editValues, forecast_value: e.target.value })}
                              className="w-32 ml-auto"
                            />
                          ) : (
                            data.forecast_value.toLocaleString("en-US", { minimumFractionDigits: 2 })
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editValues.actual_value}
                              onChange={(e) => setEditValues({ ...editValues, actual_value: e.target.value })}
                              className="w-32 ml-auto"
                            />
                          ) : (
                            data.actual_value.toLocaleString("en-US", { minimumFractionDigits: 2 })
                          )}
                        </TableCell>
                        {canEdit && (
                          <TableCell>
                            {isEditing ? (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => saveEdit(data)}
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
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(data)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {!canEdit && (
              <p className="text-sm text-muted-foreground mt-4">
                Only managers and admins can edit sales funnel data
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
