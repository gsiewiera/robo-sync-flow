import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, Cpu } from "lucide-react";
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
import { TablePagination } from "@/components/ui/table-pagination";

interface RobotModel {
  id: string;
  model_name: string;
  type: string | null;
  manufacturer: string | null;
  description: string | null;
  is_active: boolean;
  stock: number | null;
  created_at: string;
  updated_at: string;
}

const RobotModels = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState<RobotModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<RobotModel | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<RobotModel | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

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

  // Get unique types and manufacturers for filters
  const uniqueTypes = [...new Set(models.map((m) => m.type).filter(Boolean))] as string[];
  const uniqueManufacturers = [...new Set(models.map((m) => m.manufacturer).filter(Boolean))] as string[];

  const filteredModels = models.filter((model) => {
    const matchesSearch =
      model.model_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || model.type === typeFilter;
    const matchesManufacturer = manufacturerFilter === "all" || model.manufacturer === manufacturerFilter;
    return matchesSearch && matchesType && matchesManufacturer;
  });

  // Pagination
  const totalPages = Math.ceil(filteredModels.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedModels = filteredModels.slice(startIndex, startIndex + pageSize);

  return (
    <Layout>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Cpu className="w-5 h-5" />
              Robot Models ({filteredModels.length})
            </CardTitle>
            {isAdmin && (
              <Button size="sm" onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-1" />
                New Model
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <div className="relative flex-1 min-w-[150px] max-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Manufacturer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Manufacturers</SelectItem>
                {uniqueManufacturers.map((mfr) => (
                  <SelectItem key={mfr} value={mfr}>
                    {mfr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Cpu className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No robot models found</p>
              {isAdmin && (
                <Button variant="outline" size="sm" className="mt-3" onClick={handleAdd}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Model
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Model</TableHead>
                    <TableHead className="text-xs">Manufacturer</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Stock</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    {isAdmin && <TableHead className="text-xs text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedModels.map((model) => (
                    <TableRow 
                      key={model.id} 
                      className="h-10 cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/robot-models/${model.id}`)}
                    >
                      <TableCell className="font-medium py-2">{model.model_name}</TableCell>
                      <TableCell className="py-2 text-sm">{model.manufacturer || "-"}</TableCell>
                      <TableCell className="py-2 text-sm">{model.type || "-"}</TableCell>
                      <TableCell className="py-2 text-sm">{model.stock ?? 0}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant={model.is_active ? "default" : "secondary"} className="text-xs">
                          {model.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right py-2">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(model);
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(model);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredModels.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          </>
          )}
        </CardContent>
      </Card>

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