import { useState, useEffect } from "react";
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
import { UserPlus, Phone, Mail, Building2, Calendar as CalendarIcon, Edit, AlertCircle, Clock } from "lucide-react";
import { format, isAfter, isBefore, startOfDay, addDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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
  clients: {
    id: string;
    name: string;
    primary_contact_email: string | null;
    primary_contact_phone: string | null;
  };
}

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editForm, setEditForm] = useState({
    lead_status: "",
    next_action_date: undefined as Date | undefined,
    follow_up_notes: "",
    last_contact_date: undefined as Date | undefined,
  });
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalValue: 0,
    thisMonth: 0,
    overdueFollowUps: 0,
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeads();
  }, [filterStatus]);

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

      const { data, error } = await query;

      if (error) throw error;

      setLeads(data || []);

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

      setStats({
        totalLeads: data?.length || 0,
        totalValue,
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
              Leads
            </h1>
            <p className="text-muted-foreground">Manage and track potential opportunities</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Leads List</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px] bg-background">
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
                {!isLoading && leads.length > 0 && (
                  <Badge variant="outline" className="text-sm">
                    {leads.length} lead{leads.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Loading leads...</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  No leads found
                </p>
                <p className="text-sm text-muted-foreground">
                  Start by creating new offers in the leads stage
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Offer #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Next Action</TableHead>
                      <TableHead>Last Contact</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow 
                        key={lead.id} 
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleRowClick(lead.id)}
                      >
                        <TableCell className="font-medium">
                          {lead.offer_number}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              {lead.clients?.name || "N/A"}
                            </div>
                            {lead.person_contact && (
                              <span className="text-xs text-muted-foreground">{lead.person_contact}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getLeadStatusBadge(lead.lead_status)}
                        </TableCell>
                        <TableCell>
                          {lead.next_action_date ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm">{format(new Date(lead.next_action_date), "MMM dd, yyyy")}</span>
                              {getNextActionStatus(lead.next_action_date)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not set</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.last_contact_date 
                            ? format(new Date(lead.last_contact_date), "MMM dd, yyyy")
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          {lead.total_price 
                            ? `${lead.total_price.toLocaleString()} ${lead.currency}`
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          {format(new Date(lead.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleEditLead(lead, e)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
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
