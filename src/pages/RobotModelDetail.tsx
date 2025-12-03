import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Pencil, Cpu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RobotModelFormDialog } from "@/components/robot-models/RobotModelFormDialog";

interface RobotModel {
  id: string;
  model_name: string;
  type: string | null;
  manufacturer: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const RobotModelDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [model, setModel] = useState<RobotModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    checkAdminRole();
    fetchModel();
  }, [id]);

  const checkAdminRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasAdminRole = userRoles?.some((r) => r.role === "admin");
    setIsAdmin(hasAdminRole || false);
  };

  const fetchModel = async () => {
    if (!id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("robot_model_dictionary")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching robot model:", error);
      toast.error("Failed to load robot model");
    } else if (!data) {
      toast.error("Robot model not found");
      navigate("/robot-models");
    } else {
      setModel(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </Layout>
    );
  }

  if (!model) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/robot-models")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-semibold">{model.model_name}</h1>
            </div>
            <Badge variant={model.is_active ? "default" : "secondary"}>
              {model.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Model Name</p>
                  <p className="font-medium">{model.model_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{model.type || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Manufacturer</p>
                  <p className="font-medium">{model.manufacturer || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={model.is_active ? "default" : "secondary"} className="mt-1">
                    {model.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              {model.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{model.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {new Date(model.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {new Date(model.updated_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <RobotModelFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        model={model}
        onSuccess={fetchModel}
      />
    </Layout>
  );
};

export default RobotModelDetail;
