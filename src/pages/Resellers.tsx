import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Plus, Search, ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Reseller {
  id: string;
  name: string;
  nip: string | null;
  city: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  status: string;
  created_at: string | null;
}

const Resellers = () => {
  const { t } = useTranslation();
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"name" | "city" | "created_at">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReseller, setEditingReseller] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const recordsPerPage = 20;

  const [formData, setFormData] = useState({
    name: "",
    nip: "",
    address: "",
    postal_code: "",
    city: "",
    country: "Poland",
    website_url: "",
    general_email: "",
    general_phone: "",
    primary_contact_name: "",
    primary_contact_email: "",
    primary_contact_phone: "",
    billing_person_name: "",
    billing_person_email: "",
    billing_person_phone: "",
    status: "active",
  });

  useEffect(() => {
    fetchResellers();
  }, [sortField, sortDirection]);

  const fetchResellers = async () => {
    const { data, error } = await supabase
      .from("resellers")
      .select("*")
      .order(sortField, { ascending: sortDirection === "asc" });

    if (data && !error) {
      setResellers(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      const resellerData = {
        ...formData,
        assigned_salesperson_id: session?.session?.user?.id,
      };

      if (editingReseller) {
        const { error } = await supabase
          .from("resellers")
          .update(resellerData)
          .eq("id", editingReseller.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Reseller updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("resellers")
          .insert([resellerData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Reseller created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchResellers();
    } catch (error) {
      console.error("Error saving reseller:", error);
      toast({
        title: "Error",
        description: "Failed to save reseller",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (reseller: Reseller) => {
    const { data } = await supabase
      .from("resellers")
      .select("*")
      .eq("id", reseller.id)
      .single();

    if (data) {
      setEditingReseller(data);
      setFormData({
        name: data.name || "",
        nip: data.nip || "",
        address: data.address || "",
        postal_code: data.postal_code || "",
        city: data.city || "",
        country: data.country || "Poland",
        website_url: data.website_url || "",
        general_email: data.general_email || "",
        general_phone: data.general_phone || "",
        primary_contact_name: data.primary_contact_name || "",
        primary_contact_email: data.primary_contact_email || "",
        primary_contact_phone: data.primary_contact_phone || "",
        billing_person_name: data.billing_person_name || "",
        billing_person_email: data.billing_person_email || "",
        billing_person_phone: data.billing_person_phone || "",
        status: data.status || "active",
      });
      setIsDialogOpen(true);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      nip: "",
      address: "",
      postal_code: "",
      city: "",
      country: "Poland",
      website_url: "",
      general_email: "",
      general_phone: "",
      primary_contact_name: "",
      primary_contact_email: "",
      primary_contact_phone: "",
      billing_person_name: "",
      billing_person_email: "",
      billing_person_phone: "",
      status: "active",
    });
    setEditingReseller(null);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const filteredResellers = resellers.filter((reseller) => {
    return (
      reseller.name.toLowerCase().includes(search.toLowerCase()) ||
      reseller.nip?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredResellers.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredResellers.length / recordsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (field: "name" | "city" | "created_at") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: "name" | "city" | "created_at") => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const statusColors: Record<string, string> = {
    active: "bg-success text-success-foreground",
    inactive: "bg-muted text-muted-foreground",
    pending: "bg-warning text-warning-foreground",
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("resellers.title")}</h1>
            <p className="text-muted-foreground">{t("resellers.description")}</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t("resellers.addReseller")}
          </Button>
        </div>

        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={t("common.search")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("name")}
                    className="hover:bg-transparent p-0"
                  >
                    {t("common.name")}
                    {getSortIcon("name")}
                  </Button>
                </TableHead>
                <TableHead>{t("resellers.nip")}</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("city")}
                    className="hover:bg-transparent p-0"
                  >
                    {t("common.city")}
                    {getSortIcon("city")}
                  </Button>
                </TableHead>
                <TableHead>{t("resellers.primaryContact")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("created_at")}
                    className="hover:bg-transparent p-0"
                  >
                    {t("common.created")}
                    {getSortIcon("created_at")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.map((reseller) => (
                <TableRow key={reseller.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{reseller.name}</TableCell>
                  <TableCell>{reseller.nip || "-"}</TableCell>
                  <TableCell>{reseller.city || "-"}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{reseller.primary_contact_name || "-"}</div>
                      <div className="text-muted-foreground text-xs">
                        {reseller.primary_contact_email || "-"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[reseller.status] || "bg-muted"}>
                      {t(`status.${reseller.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {reseller.created_at
                      ? new Date(reseller.created_at).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/resellers/${reseller.id}`);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(reseller);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {currentRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No resellers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={() => handlePageChange(i + 1)}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingReseller ? "Edit Reseller" : "Add New Reseller"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nip">NIP</Label>
                  <Input
                    id="nip"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="general_email">General Email</Label>
                  <Input
                    id="general_email"
                    type="email"
                    value={formData.general_email}
                    onChange={(e) => setFormData({ ...formData, general_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="general_phone">General Phone</Label>
                  <Input
                    id="general_phone"
                    value={formData.general_phone}
                    onChange={(e) => setFormData({ ...formData, general_phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="website_url">Website</Label>
                  <Input
                    id="website_url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primary_contact_name">Primary Contact Name</Label>
                  <Input
                    id="primary_contact_name"
                    value={formData.primary_contact_name}
                    onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="primary_contact_email">Primary Contact Email</Label>
                  <Input
                    id="primary_contact_email"
                    type="email"
                    value={formData.primary_contact_email}
                    onChange={(e) => setFormData({ ...formData, primary_contact_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="primary_contact_phone">Primary Contact Phone</Label>
                  <Input
                    id="primary_contact_phone"
                    value={formData.primary_contact_phone}
                    onChange={(e) => setFormData({ ...formData, primary_contact_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="billing_person_name">Billing Contact Name</Label>
                  <Input
                    id="billing_person_name"
                    value={formData.billing_person_name}
                    onChange={(e) => setFormData({ ...formData, billing_person_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="billing_person_email">Billing Contact Email</Label>
                  <Input
                    id="billing_person_email"
                    type="email"
                    value={formData.billing_person_email}
                    onChange={(e) => setFormData({ ...formData, billing_person_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="billing_person_phone">Billing Contact Phone</Label>
                  <Input
                    id="billing_person_phone"
                    value={formData.billing_person_phone}
                    onChange={(e) => setFormData({ ...formData, billing_person_phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingReseller ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Resellers;
