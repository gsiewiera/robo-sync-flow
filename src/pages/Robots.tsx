import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Robot {
  id: string;
  serial_number: string;
  model: string;
  type: string;
  status: string;
  working_hours: number;
  delivery_date: string | null;
}

const statusColors: Record<string, string> = {
  in_warehouse: "bg-muted text-muted-foreground",
  delivered: "bg-success text-success-foreground",
  in_service: "bg-primary text-primary-foreground",
  maintenance: "bg-warning text-warning-foreground",
};

const Robots = () => {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchRobots();
  }, []);

  const fetchRobots = async () => {
    const { data, error } = await supabase
      .from("robots")
      .select("*")
      .order("serial_number");

    if (data && !error) {
      setRobots(data);
    }
  };

  const filteredRobots = robots.filter((robot) =>
    robot.serial_number.toLowerCase().includes(search.toLowerCase()) ||
    robot.model.toLowerCase().includes(search.toLowerCase()) ||
    robot.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Robot Registry</h1>
          <p className="text-muted-foreground">Track and manage all robots</p>
        </div>

        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by serial number, model, or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        <div className="grid gap-4">
          {filteredRobots.map((robot) => (
            <Card
              key={robot.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/robots/${robot.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold">{robot.serial_number}</h3>
                    <Badge className={statusColors[robot.status]}>
                      {robot.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {robot.model} • {robot.type}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-medium">{robot.working_hours}h</p>
                  <p className="text-xs text-muted-foreground">Working Hours</p>
                  {robot.delivery_date && (
                    <p className="text-xs text-muted-foreground">
                      Delivered: {new Date(robot.delivery_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredRobots.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No robots found</p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Robots;
