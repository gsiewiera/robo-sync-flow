import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RobotModelFormDialog } from "@/components/robot-models/RobotModelFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RobotModel {
  id: string;
  model_name: string;
  type: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const RobotModels = () => {
  const { t } = useTranslation();
  const [models, setModels] = useState<RobotModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<RobotModel | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<RobotModel | null>(null);

  useEffect(() => {
    checkAdminRole();
    fetchModels();
  }, []);

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

  const fetchModels = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("robot_model_dictionary")
      .select("*")
      .order("model_name");

    if (error) {
      console.error("Error fetching robot models:", error);
      toast.error("Failed to load robot models");
    } else {
      setModels(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (model: RobotModel) => {
    setSelectedModel(model);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedModel(null);
    setDialogOpen(true);
  };

  const handleDeleteClick = (model: RobotModel) => {
    setModelToDelete(model);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!modelToDelete) return;

    const { error } = await supabase
      .from("robot_model_dictionary")
      .delete()
      .eq("id", modelToDelete.id);

    if (error) {
      console.error("Error deleting robot model:", error);
      toast.error("Failed to delete robot model. It may be in use.");
    } else {
      toast.success("Robot model deleted successfully");
      fetchModels();
    }
    setDeleteDialogOpen(false);
    setModelToDelete(null);
  };

  const filteredModels = models.filter((model) =>
    model.model_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Robot Models</h1>
            <p className="text-muted-foreground mt-1">
              Manage robot model catalog used across the system
            </p>
          </div>
          {isAdmin && (
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              New Robot Model
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Model Catalog ({filteredModels.length})
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No robot models found</p>
                {isAdmin && (
                  <Button variant="outline" className="mt-4" onClick={handleAdd}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Model
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredModels.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell className="font-medium">{model.model_name}</TableCell>
                        <TableCell>{model.type || "-"}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {model.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={model.is_active ? "default" : "secondary"}>
                            {model.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(model)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(model)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <RobotModelFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        model={selectedModel}
        onSuccess={fetchModels}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Robot Model</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{modelToDelete?.model_name}"? This action cannot be undone.
              If the model is used in pricing or robots, the deletion may fail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default RobotModels;