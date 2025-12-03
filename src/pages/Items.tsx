import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { formatMoney } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ColumnVisibilityToggle, ColumnConfig } from "@/components/ui/column-visibility-toggle";

interface Item {
  id: string;
  name: string;
  description: string | null;
  price_net: number;
  item_type: string;
  vat_rate: number;
  is_active: boolean;
  created_at: string;
}

const Items = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const columns: ColumnConfig[] = [
    { key: "name", label: "Name", defaultVisible: true },
    { key: "type", label: "Type", defaultVisible: true },
    { key: "price_net", label: "Price (Net)", defaultVisible: true },
    { key: "vat_rate", label: "VAT Rate", defaultVisible: true },
    { key: "price_gross", label: "Price (Gross)", defaultVisible: true },
    { key: "status", label: "Status", defaultVisible: true },
  ];

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.filter((col) => col.defaultVisible).map((col) => col.key)
  );

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_net: "",
    item_type: "service",
    vat_rate: "23",
    is_active: true,
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load items",
        variant: "destructive",
      });
      return;
    }

    setItems(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const itemData = {
        name: formData.name,
        description: formData.description || null,
        price_net: parseFloat(formData.price_net),
        item_type: formData.item_type,
        vat_rate: parseFloat(formData.vat_rate),
        is_active: formData.is_active,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("items")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Item updated successfully",
        });
      } else {
        const { error } = await supabase.from("items").insert([itemData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Item created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchItems();
    } catch (error) {
      console.error("Error saving item:", error);
      toast({
        title: "Error",
        description: "Failed to save item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price_net: item.price_net.toString(),
      item_type: item.item_type,
      vat_rate: item.vat_rate.toString(),
      is_active: item.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const { error } = await supabase.from("items").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item deleted successfully",
      });

      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price_net: "",
      item_type: "service",
      vat_rate: "23",
      is_active: true,
    });
    setEditingItem(null);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-end gap-2">
            <ColumnVisibilityToggle
              columns={columns}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
            />
            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Item" : "Add New Item"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Implementation, Support, Extended Warranty"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Detailed description of the item"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="item_type">Type</Label>
                    <Select
                      value={formData.item_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, item_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="warranty">Warranty</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="implementation">Implementation</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="price_net">Price (Net)</Label>
                    <Input
                      id="price_net"
                      type="number"
                      step="0.01"
                      value={formData.price_net}
                      onChange={(e) =>
                        setFormData({ ...formData, price_net: e.target.value })
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vat_rate">VAT Rate (%)</Label>
                    <Input
                      id="vat_rate"
                      type="number"
                      step="1"
                      value={formData.vat_rate}
                      onChange={(e) =>
                        setFormData({ ...formData, vat_rate: e.target.value })
                      }
                      placeholder="23"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : editingItem ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="h-9">
                  {visibleColumns.includes("name") && (
                    <TableHead className="py-1.5 text-xs">Name</TableHead>
                  )}
                  {visibleColumns.includes("type") && (
                    <TableHead className="py-1.5 text-xs">Type</TableHead>
                  )}
                  {visibleColumns.includes("price_net") && (
                    <TableHead className="py-1.5 text-xs">Price (Net)</TableHead>
                  )}
                  {visibleColumns.includes("vat_rate") && (
                    <TableHead className="py-1.5 text-xs">VAT Rate</TableHead>
                  )}
                  {visibleColumns.includes("price_gross") && (
                    <TableHead className="py-1.5 text-xs">Price (Gross)</TableHead>
                  )}
                  {visibleColumns.includes("status") && (
                    <TableHead className="py-1.5 text-xs">Status</TableHead>
                  )}
                  <TableHead className="text-right py-1.5 text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8">
                      <Package className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No items found</p>
                      <p className="text-sm text-muted-foreground">
                        Add your first item to get started
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => {
                    const priceGross = item.price_net * (1 + item.vat_rate / 100);
                    return (
                      <TableRow key={item.id} className="h-9">
                        {visibleColumns.includes("name") && (
                          <TableCell className="py-1.5">
                            <div>
                              <div className="text-sm font-medium">{item.name}</div>
                              {item.description && (
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.includes("type") && (
                          <TableCell className="py-1.5">
                            <Badge variant="outline" className="text-xs px-1.5 py-0">{item.item_type}</Badge>
                          </TableCell>
                        )}
                        {visibleColumns.includes("price_net") && (
                          <TableCell className="py-1.5 text-sm">{formatMoney(item.price_net)} PLN</TableCell>
                        )}
                        {visibleColumns.includes("vat_rate") && (
                          <TableCell className="py-1.5 text-sm">{item.vat_rate}%</TableCell>
                        )}
                        {visibleColumns.includes("price_gross") && (
                          <TableCell className="py-1.5 text-sm font-medium">
                            {formatMoney(priceGross)} PLN
                          </TableCell>
                        )}
                        {visibleColumns.includes("status") && (
                          <TableCell className="py-1.5">
                            <Badge
                              variant={item.is_active ? "default" : "secondary"}
                              className="text-xs px-1.5 py-0"
                            >
                              {item.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell className="text-right py-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Items;
