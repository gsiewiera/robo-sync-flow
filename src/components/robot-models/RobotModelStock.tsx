import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Warehouse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Robot {
  id: string;
  serial_number: string;
  status: string | null;
  warehouse_intake_date: string | null;
}

interface RobotModelStockProps {
  modelName: string;
}

export const RobotModelStock = ({ modelName }: RobotModelStockProps) => {
  const navigate = useNavigate();
  const [robots, setRobots] = useState<Robot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStockRobots();
  }, [modelName]);

  const fetchStockRobots = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("robots")
      .select("id, serial_number, status, warehouse_intake_date")
      .eq("model", modelName)
      .is("client_id", null)
      .order("warehouse_intake_date", { ascending: false });

    if (error) {
      console.error("Error fetching stock robots:", error);
    } else {
      setRobots(data || []);
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Warehouse className="h-4 w-4" />
          In Stock ({robots.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : robots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Warehouse className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No units in warehouse for this model</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Serial Number</TableHead>
                <TableHead className="text-xs">Warehouse Intake</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {robots.map((robot) => (
                <TableRow
                  key={robot.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/robots/${robot.id}`)}
                >
                  <TableCell className="font-medium py-2">{robot.serial_number}</TableCell>
                  <TableCell className="py-2 text-sm">
                    {robot.warehouse_intake_date
                      ? new Date(robot.warehouse_intake_date).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge variant="secondary" className="text-xs">
                      {robot.status || "In Stock"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
