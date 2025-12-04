import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Pencil, Trash2, Send, Download, Mail, Megaphone, FileText, Users, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { TablePagination } from "@/components/ui/table-pagination";
import { SearchableFilterDropdown } from "@/components/ui/searchable-filter-dropdown";

interface Campaign {
  id: string;
  name: string;
  filters: any;
  client_count: number;
  created_at: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  is_active: boolean;
  created_at: string;
}

interface Mailing {
  id: string;
  campaign_id: string;
  template_id: string;
  name: string;
  status: string;
  sent_count: number;
  failed_count: number;
  total_count: number;
  created_at: string;
  sent_at: string | null;
  campaign?: { id: string; name: string };
  template?: { id: string; name: string; subject: string };
}

interface Client {
  id: string;
  name: string;
  general_email: string | null;
  city: string | null;
}

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [mailings, setMailings] = useState<Mailing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("campaigns");
  
  // Campaign view mode: "list" or "form"
  const [campaignViewMode, setCampaignViewMode] = useState<"list" | "form">("list");
  
  // Campaign form state
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [selectedClients, setSelectedClients] = useState<Client[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  
  // Filter state - now arrays for multi-select
  const [clientTypes, setClientTypes] = useState<{id: string; name: string}[]>([]);
  const [segments, setSegments] = useState<{id: string; name: string}[]>([]);
  const [markets, setMarkets] = useState<{id: string; name: string}[]>([]);
  const [sizes, setSizes] = useState<{id: string; name: string}[]>([]);
  const [selectedClientTypes, setSelectedClientTypes] = useState<string[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedDealStatuses, setSelectedDealStatuses] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  
  // Template view mode: "list" or "form"
  const [templateViewMode, setTemplateViewMode] = useState<"list" | "form">("list");
  
  // Template form state
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  
  // Mailing form state
  const [mailingDialogOpen, setMailingDialogOpen] = useState(false);
  const [mailingName, setMailingName] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  
  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: string; id: string; name: string} | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    fetchData();
    fetchFilterOptions();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchCampaigns(), fetchTemplates(), fetchMailings()]);
    setLoading(false);
  };

  const fetchCampaigns = async () => {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching campaigns:", error);
    } else {
      setCampaigns(data || []);
    }
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
    } else {
      setTemplates(data || []);
    }
  };

  const fetchMailings = async () => {
    const { data, error } = await supabase
      .from("campaign_mailings")
      .select(`
        *,
        campaign:campaigns(id, name),
        template:email_templates(id, name, subject)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching mailings:", error);
    } else {
      setMailings(data || []);
    }
  };

  const fetchFilterOptions = async () => {
    const [typesRes, segmentsRes, marketsRes, sizesRes, clientsRes] = await Promise.all([
      supabase.from("client_type_dictionary").select("id, name"),
      supabase.from("segment_dictionary").select("id, name"),
      supabase.from("market_dictionary").select("id, name"),
      supabase.from("client_size_dictionary").select("id, name"),
      supabase.from("clients").select("id, name, general_email, city"),
    ]);

    if (typesRes.data) setClientTypes(typesRes.data);
    if (segmentsRes.data) setSegments(segmentsRes.data);
    if (marketsRes.data) setMarkets(marketsRes.data);
    if (sizesRes.data) setSizes(sizesRes.data);
    if (clientsRes.data) {
      setAllClients(clientsRes.data);
      const uniqueCities = [...new Set(clientsRes.data.map(c => c.city).filter(Boolean))] as string[];
      setCities(uniqueCities.sort());
    }
  };

  const applyFilters = async () => {
    let query = supabase.from("clients").select("id, name, general_email, city");

    if (selectedCities.length > 0) {
      query = query.in("city", selectedCities);
    }

    const { data: clients, error } = await query;

    if (error) {
      console.error("Failed to filter clients");
      return;
    }

    let filteredClients = clients || [];

    // Additional filtering based on junction tables
    if (selectedClientTypes.length > 0) {
      const { data: typeClients } = await supabase
        .from("client_client_types")
        .select("client_id")
        .in("client_type_id", selectedClientTypes);
      const typeClientIds = typeClients?.map(tc => tc.client_id) || [];
      filteredClients = filteredClients.filter(c => typeClientIds.includes(c.id));
    }

    if (selectedSegments.length > 0) {
      const { data: segmentClients } = await supabase
        .from("client_segments")
        .select("client_id")
        .in("segment_id", selectedSegments);
      const segmentClientIds = segmentClients?.map(sc => sc.client_id) || [];
      filteredClients = filteredClients.filter(c => segmentClientIds.includes(c.id));
    }

    if (selectedMarkets.length > 0) {
      const { data: marketClients } = await supabase
        .from("client_markets")
        .select("client_id")
        .in("market_id", selectedMarkets);
      const marketClientIds = marketClients?.map(mc => mc.client_id) || [];
      filteredClients = filteredClients.filter(c => marketClientIds.includes(c.id));
    }

    if (selectedSizes.length > 0) {
      const { data: sizeClients } = await supabase
        .from("client_sizes")
        .select("client_id")
        .in("size_id", selectedSizes);
      const sizeClientIds = sizeClients?.map(sc => sc.client_id) || [];
      filteredClients = filteredClients.filter(c => sizeClientIds.includes(c.id));
    }

    if (selectedDealStatuses.length > 0) {
      const { data: offers } = await supabase
        .from("offers")
        .select("client_id, stage");
      
      if (offers) {
        const wonClientIds = offers.filter(o => o.stage === "won").map(o => o.client_id);
        const lostClientIds = offers.filter(o => o.stage === "lost").map(o => o.client_id);
        const leadClientIds = offers.filter(o => o.stage === "leads").map(o => o.client_id);
        
        let statusFilteredIds: string[] = [];
        if (selectedDealStatuses.includes("won")) {
          statusFilteredIds = [...statusFilteredIds, ...wonClientIds];
        }
        if (selectedDealStatuses.includes("lost")) {
          statusFilteredIds = [...statusFilteredIds, ...lostClientIds];
        }
        if (selectedDealStatuses.includes("lead")) {
          statusFilteredIds = [...statusFilteredIds, ...leadClientIds];
        }
        if (selectedDealStatuses.includes("existing")) {
          statusFilteredIds = [...statusFilteredIds, ...wonClientIds];
        }
        filteredClients = filteredClients.filter(c => statusFilteredIds.includes(c.id));
      }
    }

    setSelectedClients(filteredClients);
  };

  const saveCampaign = async () => {
    if (!campaignName.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    if (selectedClients.length === 0) {
      toast.error("Please apply filters to select clients first");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const filters = {
      clientTypes: selectedClientTypes,
      segments: selectedSegments,
      markets: selectedMarkets,
      sizes: selectedSizes,
      cities: selectedCities,
      dealStatuses: selectedDealStatuses,
    };

    if (editingCampaign) {
      // Update existing campaign
      const { error } = await supabase
        .from("campaigns")
        .update({
          name: campaignName,
          filters,
          client_count: selectedClients.length,
        })
        .eq("id", editingCampaign.id);

      if (error) {
        toast.error("Failed to update campaign");
        return;
      }

      // Update campaign clients
      await supabase.from("campaign_clients").delete().eq("campaign_id", editingCampaign.id);
      
      const clientInserts = selectedClients.map(client => ({
        campaign_id: editingCampaign.id,
        client_id: client.id,
      }));

      await supabase.from("campaign_clients").insert(clientInserts);
      toast.success("Campaign updated successfully");
    } else {
      // Create new campaign
      const { data: campaign, error } = await supabase
        .from("campaigns")
        .insert({
          name: campaignName,
          filters,
          client_count: selectedClients.length,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error || !campaign) {
        toast.error("Failed to create campaign");
        return;
      }

      // Insert campaign clients
      const clientInserts = selectedClients.map(client => ({
        campaign_id: campaign.id,
        client_id: client.id,
      }));

      await supabase.from("campaign_clients").insert(clientInserts);
      toast.success("Campaign created successfully");
    }

    resetCampaignForm();
    fetchCampaigns();
  };

  const saveTemplate = async () => {
    if (!templateName.trim() || !templateSubject.trim() || !templateBody.trim()) {
      toast.error("All fields are required");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (editingTemplate) {
      const { error } = await supabase
        .from("email_templates")
        .update({
          name: templateName,
          subject: templateSubject,
          body: templateBody,
        })
        .eq("id", editingTemplate.id);

      if (error) {
        toast.error("Failed to update template");
        return;
      }
      toast.success("Template updated successfully");
    } else {
      const { error } = await supabase
        .from("email_templates")
        .insert({
          name: templateName,
          subject: templateSubject,
          body: templateBody,
          created_by: user?.id,
        });

      if (error) {
        toast.error("Failed to create template");
        return;
      }
      toast.success("Template created successfully");
    }

    resetTemplateForm();
    fetchTemplates();
  };

  const saveMailing = async () => {
    if (!mailingName.trim() || !selectedCampaignId || !selectedTemplateId) {
      toast.error("All fields are required");
      return;
    }

    const campaign = campaigns.find(c => c.id === selectedCampaignId);

    const { error } = await supabase
      .from("campaign_mailings")
      .insert({
        name: mailingName,
        campaign_id: selectedCampaignId,
        template_id: selectedTemplateId,
        total_count: campaign?.client_count || 0,
      });

    if (error) {
      toast.error("Failed to create mailing");
      return;
    }

    toast.success("Mailing created successfully");
    resetMailingForm();
    fetchMailings();
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    const tableName = itemToDelete.type === "campaign" ? "campaigns" 
      : itemToDelete.type === "template" ? "email_templates" 
      : "campaign_mailings";

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("id", itemToDelete.id);

    if (error) {
      toast.error(`Failed to delete ${itemToDelete.type}`);
    } else {
      toast.success(`${itemToDelete.type} deleted successfully`);
      fetchData();
    }

    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const exportCampaign = async (campaign: Campaign) => {
    const { data: campaignClients } = await supabase
      .from("campaign_clients")
      .select("client:clients(id, name, general_email, city)")
      .eq("campaign_id", campaign.id);

    if (!campaignClients) {
      toast.error("Failed to export campaign");
      return;
    }

    const csvContent = [
      ["Name", "Email", "City"].join(","),
      ...campaignClients.map(cc => {
        const client = cc.client as any;
        return [client?.name || "", client?.general_email || "", client?.city || ""].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campaign.name.replace(/\s+/g, "_")}_clients.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Campaign exported successfully");
  };

  const sendMailing = async (mailing: Mailing) => {
    toast.info("Bulk email sending will be implemented with an edge function");
  };

  const resetCampaignForm = () => {
    setCampaignViewMode("list");
    setEditingCampaign(null);
    setCampaignName("");
    setSelectedClients([]);
    setSelectedClientTypes([]);
    setSelectedSegments([]);
    setSelectedMarkets([]);
    setSelectedSizes([]);
    setSelectedCities([]);
    setSelectedDealStatuses([]);
  };

  const resetTemplateForm = () => {
    setTemplateViewMode("list");
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateSubject("");
    setTemplateBody("");
  };

  const resetMailingForm = () => {
    setMailingDialogOpen(false);
    setMailingName("");
    setSelectedCampaignId("");
    setSelectedTemplateId("");
  };

  const editCampaign = async (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setCampaignName(campaign.name);
    
    const filters = campaign.filters as any;
    setSelectedClientTypes(filters.clientTypes || filters.clientType ? [filters.clientType].filter(v => v && v !== "all") : []);
    setSelectedSegments(filters.segments || filters.segment ? [filters.segment].filter(v => v && v !== "all") : []);
    setSelectedMarkets(filters.markets || filters.market ? [filters.market].filter(v => v && v !== "all") : []);
    setSelectedSizes(filters.sizes || filters.size ? [filters.size].filter(v => v && v !== "all") : []);
    setSelectedCities(filters.cities || filters.city ? [filters.city].filter(v => v && v !== "all") : []);
    setSelectedDealStatuses(filters.dealStatuses || filters.dealStatus ? [filters.dealStatus].filter(v => v && v !== "all") : []);
    
    // Load campaign clients
    const { data: campaignClients } = await supabase
      .from("campaign_clients")
      .select("client:clients(id, name, general_email, city)")
      .eq("campaign_id", campaign.id);
    
    if (campaignClients) {
      setSelectedClients(campaignClients.map(cc => cc.client as any).filter(Boolean));
    }
    
    setCampaignViewMode("form");
  };

  const editTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateSubject(template.subject);
    setTemplateBody(template.body);
    setTemplateViewMode("form");
  };

  // Pagination for current tab
  const getCurrentItems = () => {
    if (activeTab === "campaigns") return campaigns;
    if (activeTab === "templates") return templates;
    return mailings;
  };

  const totalItems = getCurrentItems().length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCampaigns = campaigns.slice(startIndex, startIndex + pageSize);
  const paginatedTemplates = templates.slice(startIndex, startIndex + pageSize);
  const paginatedMailings = mailings.slice(startIndex, startIndex + pageSize);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-500">Sent</Badge>;
      case "sending":
        return <Badge className="bg-blue-500">Sending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  return (
    <Layout>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="w-5 h-5" />
            Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }}>
            <TabsList className="mb-4">
              <TabsTrigger value="campaigns" className="gap-2">
                <Users className="w-4 h-4" />
                Campaigns
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2">
                <FileText className="w-4 h-4" />
                Email Templates
              </TabsTrigger>
              <TabsTrigger value="mailings" className="gap-2">
                <Mail className="w-4 h-4" />
                Mailings
              </TabsTrigger>
            </TabsList>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns">
              {campaignViewMode === "form" ? (
                // Inline Campaign Form
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <Button variant="ghost" size="sm" onClick={resetCampaignForm}>
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                    <h3 className="text-lg font-semibold">
                      {editingCampaign ? "Edit Campaign" : "Create Campaign"}
                    </h3>
                  </div>
                  
                  <div>
                    <Label>Campaign Name</Label>
                    <Input
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="Enter campaign name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">Client Type</Label>
                      <SearchableFilterDropdown
                        options={clientTypes.map(t => ({ id: t.id, label: t.name }))}
                        selectedValues={selectedClientTypes}
                        onToggle={(id) => {
                          setSelectedClientTypes(prev => 
                            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
                          );
                        }}
                        placeholder="All Types"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">Segment</Label>
                      <SearchableFilterDropdown
                        options={segments.map(s => ({ id: s.id, label: s.name }))}
                        selectedValues={selectedSegments}
                        onToggle={(id) => {
                          setSelectedSegments(prev => 
                            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
                          );
                        }}
                        placeholder="All Segments"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">Market</Label>
                      <SearchableFilterDropdown
                        options={markets.map(m => ({ id: m.id, label: m.name }))}
                        selectedValues={selectedMarkets}
                        onToggle={(id) => {
                          setSelectedMarkets(prev => 
                            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
                          );
                        }}
                        placeholder="All Markets"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">Size</Label>
                      <SearchableFilterDropdown
                        options={sizes.map(s => ({ id: s.id, label: s.name }))}
                        selectedValues={selectedSizes}
                        onToggle={(id) => {
                          setSelectedSizes(prev => 
                            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
                          );
                        }}
                        placeholder="All Sizes"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">City</Label>
                      <SearchableFilterDropdown
                        options={cities.map(c => ({ id: c, label: c }))}
                        selectedValues={selectedCities}
                        onToggle={(id) => {
                          setSelectedCities(prev => 
                            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
                          );
                        }}
                        placeholder="All Cities"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">Deal Status</Label>
                      <SearchableFilterDropdown
                        options={[
                          { id: "existing", label: "Existing Client" },
                          { id: "won", label: "Deal Won" },
                          { id: "lost", label: "Deal Lost" },
                          { id: "lead", label: "Existing Lead" },
                        ]}
                        selectedValues={selectedDealStatuses}
                        onToggle={(id) => {
                          setSelectedDealStatuses(prev => 
                            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
                          );
                        }}
                        placeholder="All Statuses"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <Button onClick={applyFilters} variant="secondary" className="w-full">
                    Count Matching Clients
                  </Button>

                  {selectedClients.length > 0 && (
                    <div className="border rounded-md p-4 bg-muted/30">
                      <p className="text-sm font-medium text-center">
                        {selectedClients.length} clients match current filters
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={resetCampaignForm}>Cancel</Button>
                    <Button onClick={saveCampaign}>
                      {editingCampaign ? "Update" : "Create"} Campaign
                    </Button>
                  </div>
                </div>
              ) : (
                // Campaign List View
                <>
                  <div className="flex justify-end mb-4">
                    <Button size="sm" onClick={() => setCampaignViewMode("form")}>
                      <Plus className="w-4 h-4 mr-1" />
                      New Campaign
                    </Button>
                  </div>

                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  ) : campaigns.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No campaigns yet</p>
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Campaign Name</TableHead>
                            <TableHead>Clients</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedCampaigns.map(campaign => (
                            <TableRow key={campaign.id}>
                              <TableCell className="font-medium">{campaign.name}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{campaign.client_count}</Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(campaign.created_at), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editCampaign(campaign)}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => exportCampaign(campaign)}>
                                    <Download className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7"
                                    onClick={() => {
                                      setItemToDelete({ type: "campaign", id: campaign.id, name: campaign.name });
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <TablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        totalItems={campaigns.length}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                      />
                    </>
                  )}
                </>
              )}
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates">
              {templateViewMode === "form" ? (
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={resetTemplateForm}>
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <CardTitle className="text-lg">
                        {editingTemplate ? "Edit Template" : "Create Template"}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Template Name</Label>
                      <Input
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Enter template name"
                      />
                    </div>
                    <div>
                      <Label>Email Subject</Label>
                      <Input
                        value={templateSubject}
                        onChange={(e) => setTemplateSubject(e.target.value)}
                        placeholder="Enter email subject"
                      />
                    </div>
                    <div>
                      <Label>Email Body</Label>
                      <Textarea
                        value={templateBody}
                        onChange={(e) => setTemplateBody(e.target.value)}
                        placeholder="Enter email body (HTML supported)"
                        className="min-h-[300px]"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use {`{{client_name}}`} for client name placeholder
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={resetTemplateForm}>Cancel</Button>
                      <Button onClick={saveTemplate}>
                        {editingTemplate ? "Update" : "Create"} Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex justify-end mb-4">
                    <Button size="sm" onClick={() => setTemplateViewMode("form")}>
                      <Plus className="w-4 h-4 mr-1" />
                      New Template
                    </Button>
                  </div>

                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No email templates yet</p>
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Template Name</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedTemplates.map(template => (
                            <TableRow key={template.id}>
                              <TableCell className="font-medium">{template.name}</TableCell>
                              <TableCell className="text-sm">{template.subject}</TableCell>
                              <TableCell>
                                <Badge variant={template.is_active ? "default" : "secondary"}>
                                  {template.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(template.created_at), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editTemplate(template)}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7"
                                    onClick={() => {
                                      setItemToDelete({ type: "template", id: template.id, name: template.name });
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <TablePagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(templates.length / pageSize)}
                        pageSize={pageSize}
                        totalItems={templates.length}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                      />
                    </>
                  )}
                </>
              )}
            </TabsContent>

            {/* Mailings Tab */}
            <TabsContent value="mailings">
              <div className="flex justify-end mb-4">
                <Dialog open={mailingDialogOpen} onOpenChange={(open) => !open && resetMailingForm()}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => setMailingDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-1" />
                      New Mailing
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Mailing</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Mailing Name</Label>
                        <Input
                          value={mailingName}
                          onChange={(e) => setMailingName(e.target.value)}
                          placeholder="Enter mailing name"
                        />
                      </div>
                      <div>
                        <Label>Campaign</Label>
                        <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select campaign" />
                          </SelectTrigger>
                          <SelectContent>
                            {campaigns.map(c => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name} ({c.client_count} clients)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Email Template</Label>
                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.filter(t => t.is_active).map(t => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={resetMailingForm}>Cancel</Button>
                        <Button onClick={saveMailing}>Create Mailing</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : mailings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No mailings yet</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mailing Name</TableHead>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Stats</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMailings.map(mailing => (
                        <TableRow key={mailing.id}>
                          <TableCell className="font-medium">{mailing.name}</TableCell>
                          <TableCell className="text-sm">{(mailing.campaign as any)?.name || "-"}</TableCell>
                          <TableCell className="text-sm">{(mailing.template as any)?.name || "-"}</TableCell>
                          <TableCell>{getStatusBadge(mailing.status)}</TableCell>
                          <TableCell className="text-sm">
                            <span className="text-green-600">{mailing.sent_count}</span>
                            {" / "}
                            <span className="text-red-600">{mailing.failed_count}</span>
                            {" / "}
                            {mailing.total_count}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(mailing.created_at), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {mailing.status === "draft" && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7"
                                  onClick={() => sendMailing(mailing)}
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => {
                                  setItemToDelete({ type: "mailing", id: mailing.id, name: mailing.name });
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(mailings.length / pageSize)}
                    pageSize={pageSize}
                    totalItems={mailings.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                  />
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemToDelete?.type}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
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

export default Campaigns;
