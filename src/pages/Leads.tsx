import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Phone, Mail, Building2, Calendar as CalendarIcon, Edit, AlertCircle, Clock, Plus, Eye, TrendingUp, ChevronDown } from "lucide-react";
import { SearchableFilterDropdown } from "@/components/ui/searchable-filter-dropdown";
import { format, isAfter, isBefore, startOfDay, addDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NewOfferDialog } from "@/components/offers/NewOfferDialog";
import { ColumnVisibilityToggle, ColumnConfig } from "@/components/ui/column-visibility-toggle";

interface Lead {
  id: string;
  offer_number: string;
  person_contact: string | null;
  deployment_location: string | null;
  created_at: string;
  total_price: number | null;
  currency: string;
  lead_status: string | null;
  next_action_date: string | null;
  follow_up_notes: string | null;
  last_contact_date: string | null;
  assigned_salesperson_id: string | null;
  salesperson_name?: string | null;
  clients: {
    id: string;
    name: string;
    primary_contact_email: string | null;
    primary_contact_phone: string | null;
  };
}

interface Salesperson {
  id: string;
  full_name: string;
}

const columns: ColumnConfig[] = [
  { key: "offer_number", label: "Offer #", defaultVisible: true },
  { key: "client", label: "Client", defaultVisible: true },
  { key: "salesperson", label: "Salesperson", defaultVisible: true },
  { key: "status", label: "Status", defaultVisible: true },
  { key: "next_action", label: "Next Action", defaultVisible: true },
  { key: "last_contact", label: "Last Contact", defaultVisible: false },
  { key: "value", label: "Value", defaultVisible: true },
  { key: "margin", label: "Margin", defaultVisible: true },
  { key: "created", label: "Created", defaultVisible: false },
];

const Leads = () => {
  const { t } = useTranslation();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadMargins, setLeadMargins] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [salespersonFilters, setSalespersonFilters] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.filter(col => col.defaultVisible !== false).map(col => col.key)
  );
  const [editForm, setEditForm] = useState({
    lead_status: "",
    next_action_date: undefined as Date | undefined,
    follow_up_notes: "",
    last_contact_date: undefined as Date | undefined,
    assigned_salesperson_id: "" as string | null,
  });
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalValue: 0,
    totalMargin: 0,
    thisMonth: 0,
    overdueFollowUps: 0,
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSalespeople();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [filterStatus, salespersonFilters]);

  const fetchSalespeople = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");

    if (data && !error) {
      setSalespeople(data);
    }
  };

  const toggleSalespersonFilter = (salespersonId: string) => {
    setSalespersonFilters((prev) =>
      prev.includes(salespersonId)
        ? prev.filter((id) => id !== salespersonId)
        : [...prev, salespersonId]
    );
  };

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("offers")
        .select(`
          *,
          clients (
            id,
            name,
            primary_contact_email,
            primary_contact_phone
          )
        `)
        .eq("stage", "leads")
        .order("next_action_date", { ascending: true, nullsFirst: false });

      if (filterStatus !== "all") {
        query = query.eq("lead_status", filterStatus);
      }

      if (salespersonFilters.length > 0) {
        query = query.in("assigned_salesperson_id", salespersonFilters);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch salesperson names
      const salespersonIds = [...new Set(data?.filter(l => l.assigned_salesperson_id).map(l => l.assigned_salesperson_id) || [])];
      let salespersonMap: Record<string, string> = {};
      
      if (salespersonIds.length > 0) {
        const { data: salespersonData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", salespersonIds as string[]);
        
        if (salespersonData) {
          salespersonMap = Object.fromEntries(salespersonData.map(s => [s.id, s.full_name]));
        }
      }

      const leadsWithSalesperson = data?.map(lead => ({
        ...lead,
        salesperson_name: lead.assigned_salesperson_id ? salespersonMap[lead.assigned_salesperson_id] : null
      })) || [];

      setLeads(leadsWithSalesperson);

      // Calculate stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const today = startOfDay(now);
      
      const totalValue = data?.reduce((sum, lead) => sum + (lead.total_price || 0), 0) || 0;
      const thisMonthCount = data?.filter(
        lead => new Date(lead.created_at) >= startOfMonth
      ).length || 0;
      
      const overdueCount = data?.filter(lead => {
        if (!lead.next_action_date) return false;
        return isBefore(new Date(lead.next_action_date), today);
      }).length || 0;

      // Calculate total margin and per-lead margins
      const leadIds = data?.map(l => l.id) || [];
      let totalMargin = 0;
      const marginsByLead: Record<string, number> = {};
      
      if (leadIds.length > 0) {
        // Fetch offer items for all leads
        const { data: offerItems } = await supabase
          .from("offer_items")
          .select("*")
          .in("offer_id", leadIds);
        
        // Fetch robot pricing for margin calculation
        const { data: robotPricing } = await supabase
          .from("robot_pricing")
          .select("robot_model, evidence_price_pln_net, evidence_price_usd_net, evidence_price_eur_net");
        
        // Fetch lease pricing
        const { data: leasePricing } = await supabase
          .from("lease_pricing")
          .select("robot_pricing_id, months, evidence_price_pln_net, evidence_price_usd_net, evidence_price_eur_net");
        
        // Create lookup maps
        const robotPricingMap = new Map(robotPricing?.map(rp => [rp.robot_model, rp]) || []);
        
        // Initialize margins for each lead
        leadIds.forEach(id => { marginsByLead[id] = 0; });
        
        // Calculate margins for each item and accumulate per lead
        offerItems?.forEach(item => {
          const robotCost = robotPricingMap.get(item.robot_model);
          const quantity = item.quantity || 1;
          let itemMargin = 0;
          
          if (item.contract_type === 'lease' && item.lease_months) {
            // For lease, find the lease pricing entry
            const leaseEntry = leasePricing?.find(
              lp => robotPricing?.find(rp => rp.robot_model === item.robot_model) && 
              lp.months === item.lease_months
            );
            if (leaseEntry?.evidence_price_pln_net) {
              itemMargin = ((item.unit_price || 0) - (leaseEntry.evidence_price_pln_net || 0)) * quantity * item.lease_months;
            }
          } else {
            // For purchase
            if (robotCost?.evidence_price_pln_net) {
              itemMargin = ((item.unit_price || 0) - (robotCost.evidence_price_pln_net || 0)) * quantity;
            }
          }
          
          totalMargin += itemMargin;
          if (item.offer_id) {
            marginsByLead[item.offer_id] = (marginsByLead[item.offer_id] || 0) + itemMargin;
          }
        });
      }

      setLeadMargins(marginsByLead);
      setStats({
        totalLeads: data?.length || 0,
        totalValue,
        totalMargin,
        thisMonth: thisMonthCount,
        overdueFollowUps: overdueCount,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (offerId: string) => {
    navigate(`/offers/${offerId}`);
  };

  const getLeadStatusBadge = (status: string | null) => {
    switch (status) {
      case "new":
        return <Badge variant="secondary">New</Badge>;
      case "contacted":
        return <Badge className="bg-chart-2 text-white">Contacted</Badge>;
      case "qualified":
        return <Badge className="bg-success text-white">Qualified</Badge>;
      case "nurturing":
        return <Badge className="bg-chart-3 text-white">Nurturing</Badge>;
      case "follow_up_scheduled":
        return <Badge className="bg-primary text-white">Follow-up Scheduled</Badge>;
      case "on_hold":
        return <Badge variant="outline">On Hold</Badge>;
      default:
        return <Badge variant="secondary">New</Badge>;
    }
  };

  const getNextActionStatus = (nextActionDate: string | null) => {
    if (!nextActionDate) return null;
    
    const today = startOfDay(new Date());
    const actionDate = startOfDay(new Date(nextActionDate));
    const threeDaysFromNow = addDays(today, 3);

    if (isBefore(actionDate, today)) {
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" />Overdue</Badge>;
    } else if (isBefore(actionDate, threeDaysFromNow)) {
      return <Badge className="bg-orange-500 text-white gap-1"><Clock className="w-3 h-3" />Soon</Badge>;
    }
    return null;
  };

  const handleEditLead = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLead(lead);
    setEditForm({
      lead_status: lead.lead_status || "new",
      next_action_date: lead.next_action_date ? new Date(lead.next_action_date) : undefined,
      follow_up_notes: lead.follow_up_notes || "",
      last_contact_date: lead.last_contact_date ? new Date(lead.last_contact_date) : undefined,
      assigned_salesperson_id: lead.assigned_salesperson_id || null,
    });
    setIsDialogOpen(true);
  };

  const handleSaveLeadStatus = async () => {
    if (!selectedLead) return;

    try {
      const { error } = await supabase
        .from("offers")
        .update({
          lead_status: editForm.lead_status,
          next_action_date: editForm.next_action_date ? format(editForm.next_action_date, "yyyy-MM-dd") : null,
          follow_up_notes: editForm.follow_up_notes,
          last_contact_date: editForm.last_contact_date ? format(editForm.last_contact_date, "yyyy-MM-dd") : null,
          assigned_salesperson_id: editForm.assigned_salesperson_id || null,
        })
        .eq("id", selectedLead.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead status updated successfully",
      });

      setIsDialogOpen(false);
      fetchLeads();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <UserPlus className="w-8 h-8" />
              {t("leads.title")}
            </h1>
            <p className="text-muted-foreground">{t("leads.description")}</p>
          </div>
          <Button onClick={() => setIsNewLeadOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("leads.addLead")}
          </Button>
        </div>

        <NewOfferDialog
          open={isNewLeadOpen}
          onOpenChange={setIsNewLeadOpen}
          onSuccess={fetchLeads}
          mode="lead"
        />

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="hover-scale animate-fade-in bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Leads
              </CardTitle>
              <UserPlus className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.totalLeads}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active opportunities
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale animate-fade-in bg-gradient-to-br from-success/5 to-transparent" style={{ animationDelay: "100ms" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Value
              </CardTitle>
              <Building2 className="w-5 h-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {stats.totalValue.toLocaleString()} PLN
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Potential revenue
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale animate-fade-in bg-gradient-to-br from-emerald-500/5 to-transparent" style={{ animationDelay: "150ms" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Margin
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-500">
                {stats.totalMargin.toLocaleString()} PLN
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Potential profit
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale animate-fade-in bg-gradient-to-br from-chart-2/5 to-transparent" style={{ animationDelay: "200ms" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                This Month
              </CardTitle>
              <CalendarIcon className="w-5 h-5 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ color: "hsl(var(--chart-2))" }}>
                {stats.thisMonth}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                New leads
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale animate-fade-in bg-gradient-to-br from-destructive/5 to-transparent" style={{ animationDelay: "300ms" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Overdue
              </CardTitle>
              <AlertCircle className="w-5 h-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {stats.overdueFollowUps}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Need follow-up
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Leads List</CardTitle>
              <div className="flex items-center gap-2">
                <SearchableFilterDropdown
                  options={salespeople.map((s) => ({ id: s.id, label: s.full_name }))}
                  selectedValues={salespersonFilters}
                  onToggle={toggleSalespersonFilter}
                  placeholder="Salesperson"
                  searchPlaceholder="Search salesperson..."
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px] bg-background h-10">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-background">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="nurturing">Nurturing</SelectItem>
                    <SelectItem value="follow_up_scheduled">Follow-up Scheduled</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                <ColumnVisibilityToggle
                  columns={columns}
                  visibleColumns={visibleColumns}
                  onToggleColumn={(key) => setVisibleColumns(prev => 
                    prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
                  )}
                />
                {!isLoading && leads.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {leads.length} lead{leads.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-3"></div>
                <p className="text-muted-foreground text-sm">Loading leads...</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-base font-medium text-muted-foreground mb-1">
                  No leads found
                </p>
                <p className="text-xs text-muted-foreground">
                  Start by creating new offers in the leads stage
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="h-9">
                      {visibleColumns.includes("offer_number") && <TableHead className="py-1.5 text-xs">Offer #</TableHead>}
                      {visibleColumns.includes("client") && <TableHead className="py-1.5 text-xs">Client</TableHead>}
                      {visibleColumns.includes("salesperson") && <TableHead className="py-1.5 text-xs">Salesperson</TableHead>}
                      {visibleColumns.includes("status") && <TableHead className="py-1.5 text-xs">Status</TableHead>}
                      {visibleColumns.includes("next_action") && <TableHead className="py-1.5 text-xs">Next Action</TableHead>}
                      {visibleColumns.includes("last_contact") && <TableHead className="py-1.5 text-xs">Last Contact</TableHead>}
                      {visibleColumns.includes("value") && <TableHead className="py-1.5 text-xs">Value</TableHead>}
                      {visibleColumns.includes("margin") && <TableHead className="py-1.5 text-xs text-emerald-600">Margin</TableHead>}
                      {visibleColumns.includes("created") && <TableHead className="py-1.5 text-xs">Created</TableHead>}
                      <TableHead className="w-20 py-1.5 text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow 
                        key={lead.id} 
                        className="h-9 hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleRowClick(lead.id)}
                      >
                        {visibleColumns.includes("offer_number") && (
                          <TableCell className="py-1.5 text-sm font-medium">
                            {lead.offer_number}
                          </TableCell>
                        )}
                        {visibleColumns.includes("client") && (
                          <TableCell className="py-1.5">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm truncate max-w-[150px]">{lead.clients?.name || "N/A"}</span>
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.includes("salesperson") && (
                          <TableCell className="py-1.5 text-sm text-muted-foreground">
                            {lead.salesperson_name || "-"}
                          </TableCell>
                        )}
                        {visibleColumns.includes("status") && (
                          <TableCell className="py-1.5">
                            {getLeadStatusBadge(lead.lead_status)}
                          </TableCell>
                        )}
                        {visibleColumns.includes("next_action") && (
                          <TableCell className="py-1.5">
                            {lead.next_action_date ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs">{format(new Date(lead.next_action_date), "MMM dd")}</span>
                                {getNextActionStatus(lead.next_action_date)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.includes("last_contact") && (
                          <TableCell className="py-1.5 text-xs text-muted-foreground">
                            {lead.last_contact_date 
                              ? format(new Date(lead.last_contact_date), "MMM dd")
                              : "-"
                            }
                          </TableCell>
                        )}
                        {visibleColumns.includes("value") && (
                          <TableCell className="py-1.5 text-xs">
                            {lead.total_price 
                              ? `${lead.total_price.toLocaleString()} ${lead.currency}`
                              : "-"
                            }
                          </TableCell>
                        )}
                        {visibleColumns.includes("margin") && (
                          <TableCell className="py-1.5 text-xs text-emerald-500 font-medium">
                            {leadMargins[lead.id] 
                              ? `${leadMargins[lead.id].toLocaleString()}`
                              : "-"
                            }
                          </TableCell>
                        )}
                        {visibleColumns.includes("created") && (
                          <TableCell className="py-1.5 text-xs text-muted-foreground">
                            {format(new Date(lead.created_at), "MMM dd")}
                          </TableCell>
                        )}
                        <TableCell className="py-1.5">
                          <div className="flex gap-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/offers/${lead.id}`);
                              }}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => handleEditLead(lead, e)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Lead Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Lead Status</Label>
                <Select
                  value={editForm.lead_status}
                  onValueChange={(value) => setEditForm({ ...editForm, lead_status: value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-background">
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="nurturing">Nurturing</SelectItem>
                    <SelectItem value="follow_up_scheduled">Follow-up Scheduled</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assigned Salesperson</Label>
                <Select
                  value={editForm.assigned_salesperson_id || "none"}
                  onValueChange={(value) => setEditForm({ ...editForm, assigned_salesperson_id: value === "none" ? null : value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select salesperson" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-background">
                    <SelectItem value="none">No salesperson assigned</SelectItem>
                    {salespeople.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id}>
                        {sp.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Next Action Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background",
                        !editForm.next_action_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editForm.next_action_date 
                        ? format(editForm.next_action_date, "MMM dd, yyyy") 
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-background" align="start">
                    <Calendar
                      mode="single"
                      selected={editForm.next_action_date}
                      onSelect={(date) => setEditForm({ ...editForm, next_action_date: date })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Last Contact Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background",
                        !editForm.last_contact_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editForm.last_contact_date 
                        ? format(editForm.last_contact_date, "MMM dd, yyyy") 
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-background" align="start">
                    <Calendar
                      mode="single"
                      selected={editForm.last_contact_date}
                      onSelect={(date) => setEditForm({ ...editForm, last_contact_date: date })}
                      initialFocus
                      className="pointer-events-auto"
                      disabled={(date) => isAfter(date, new Date())}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Follow-up Notes</Label>
                <Textarea
                  value={editForm.follow_up_notes}
                  onChange={(e) => setEditForm({ ...editForm, follow_up_notes: e.target.value })}
                  placeholder="Add notes about next steps, discussion points, etc."
                  rows={4}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveLeadStatus}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Leads;
