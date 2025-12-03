import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Save, X, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DictionaryItem {
  id: string;
  name: string;
}

interface ClientInlineEditProps {
  client: any;
  onSave: () => void;
  onCancel: () => void;
}

export function ClientInlineEdit({ client, onSave, onCancel }: ClientInlineEditProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [resellers, setResellers] = useState<any[]>([]);
  const [salespeople, setSalespeople] = useState<{ id: string; full_name: string }[]>([]);

  // Dictionary data
  const [clientTypes, setClientTypes] = useState<DictionaryItem[]>([]);
  const [markets, setMarkets] = useState<DictionaryItem[]>([]);
  const [segments, setSegments] = useState<DictionaryItem[]>([]);
  const [clientSizes, setClientSizes] = useState<DictionaryItem[]>([]);

  // Selected values for multi-select
  const [selectedClientTypes, setSelectedClientTypes] = useState<string[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [selectedClientSize, setSelectedClientSize] = useState<string>("");

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    nip: "",
    address: "",
    city: "",
    postal_code: "",
    country: "Poland",
    general_email: "",
    general_phone: "",
    website_url: "",
    balance: 0,
    status: "active",
    reseller_id: "",
    assigned_salesperson_id: "",
  });

  useEffect(() => {
    fetchTags();
    fetchResellers();
    fetchSalespeople();
    fetchDictionaries();
    fetchClientTags();
    fetchClientClassifications();
    
    // Populate form with client data
    setFormData({
      name: client.name || "",
      nip: client.nip || "",
      address: client.address || "",
      city: client.city || "",
      postal_code: client.postal_code || "",
      country: client.country || "Poland",
      general_email: client.general_email || "",
      general_phone: client.general_phone || "",
      website_url: client.website_url || "",
      balance: client.balance || 0,
      status: client.status || "active",
      reseller_id: client.reseller_id || "",
      assigned_salesperson_id: client.assigned_salesperson_id || "",
    });
  }, [client]);

  const fetchDictionaries = async () => {
    const [typesRes, marketsRes, segmentsRes, sizesRes] = await Promise.all([
      supabase.from("client_type_dictionary").select("id, name").order("name"),
      supabase.from("market_dictionary").select("id, name").order("name"),
      supabase.from("segment_dictionary").select("id, name").order("name"),
      supabase.from("client_size_dictionary").select("id, name").order("name"),
    ]);

    if (typesRes.data) setClientTypes(typesRes.data);
    if (marketsRes.data) setMarkets(marketsRes.data);
    if (segmentsRes.data) setSegments(segmentsRes.data);
    if (sizesRes.data) setClientSizes(sizesRes.data);
  };

  const fetchClientClassifications = async () => {
    const [typesRes, marketsRes, segmentsRes, sizesRes] = await Promise.all([
      supabase.from("client_client_types").select("client_type_id").eq("client_id", client.id),
      supabase.from("client_markets").select("market_id").eq("client_id", client.id),
      supabase.from("client_segments").select("segment_id").eq("client_id", client.id),
      supabase.from("client_sizes").select("size_id").eq("client_id", client.id),
    ]);

    if (typesRes.data) setSelectedClientTypes(typesRes.data.map(t => t.client_type_id));
    if (marketsRes.data) setSelectedMarkets(marketsRes.data.map(m => m.market_id));
    if (segmentsRes.data) setSelectedSegments(segmentsRes.data.map(s => s.segment_id));
    if (sizesRes.data && sizesRes.data.length > 0) setSelectedClientSize(sizesRes.data[0].size_id);
  };

  const fetchSalespeople = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");
    if (data) setSalespeople(data);
  };

  const fetchTags = async () => {
    const { data } = await supabase
      .from("client_tags")
      .select("*")
      .order("name");
    if (data) setAvailableTags(data);
  };

  const fetchResellers = async () => {
    const { data } = await supabase
      .from("resellers")
      .select("id, name")
      .eq("status", "active")
      .order("name");
    if (data) setResellers(data);
  };

  const fetchClientTags = async () => {
    const { data } = await supabase
      .from("client_assigned_tags")
      .select("tag_id")
      .eq("client_id", client.id);
    if (data) setSelectedTags(data.map(t => t.tag_id));
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const toggleClientType = (typeId: string) => {
    setSelectedClientTypes(prev =>
      prev.includes(typeId) ? prev.filter(id => id !== typeId) : [...prev, typeId]
    );
  };

  const toggleMarket = (marketId: string) => {
    setSelectedMarkets(prev =>
      prev.includes(marketId) ? prev.filter(id => id !== marketId) : [...prev, marketId]
    );
  };

  const toggleSegment = (segmentId: string) => {
    setSelectedSegments(prev =>
      prev.includes(segmentId) ? prev.filter(id => id !== segmentId) : [...prev, segmentId]
    );
  };

  const saveClientClassifications = async (clientId: string) => {
    await Promise.all([
      supabase.from("client_client_types").delete().eq("client_id", clientId),
      supabase.from("client_markets").delete().eq("client_id", clientId),
      supabase.from("client_segments").delete().eq("client_id", clientId),
      supabase.from("client_sizes").delete().eq("client_id", clientId),
    ]);

    const insertPromises = [];

    if (selectedClientTypes.length > 0) {
      insertPromises.push(
        supabase.from("client_client_types").insert(
          selectedClientTypes.map(typeId => ({ client_id: clientId, client_type_id: typeId }))
        )
      );
    }

    if (selectedMarkets.length > 0) {
      insertPromises.push(
        supabase.from("client_markets").insert(
          selectedMarkets.map(marketId => ({ client_id: clientId, market_id: marketId }))
        )
      );
    }

    if (selectedSegments.length > 0) {
      insertPromises.push(
        supabase.from("client_segments").insert(
          selectedSegments.map(segmentId => ({ client_id: clientId, segment_id: segmentId }))
        )
      );
    }

    if (selectedClientSize) {
      insertPromises.push(
        supabase.from("client_sizes").insert({ client_id: clientId, size_id: selectedClientSize })
      );
    }

    await Promise.all(insertPromises);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Company name is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const clientData = {
        name: formData.name,
        nip: formData.nip || null,
        address: formData.address || null,
        city: formData.city || null,
        postal_code: formData.postal_code || null,
        country: formData.country || null,
        general_email: formData.general_email || null,
        general_phone: formData.general_phone || null,
        website_url: formData.website_url || null,
        balance: formData.balance || 0,
        status: formData.status,
        reseller_id: formData.reseller_id || null,
        assigned_salesperson_id: formData.assigned_salesperson_id || null,
      };

      const { error } = await supabase
        .from("clients")
        .update(clientData)
        .eq("id", client.id);

      if (error) throw error;

      // Update tags
      await supabase.from("client_assigned_tags").delete().eq("client_id", client.id);
      if (selectedTags.length > 0) {
        await supabase.from("client_assigned_tags").insert(
          selectedTags.map(tagId => ({ client_id: client.id, tag_id: tagId }))
        );
      }

      // Save classifications
      await saveClientClassifications(client.id);

      toast({ title: "Client updated successfully" });
      onSave();
    } catch (error: any) {
      toast({ title: "Error updating client", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const MultiSelectField = ({
    label,
    items,
    selectedIds,
    onToggle,
    placeholder,
  }: {
    label: string;
    items: DictionaryItem[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    placeholder: string;
  }) => {
    const selectedItems = items.filter(item => selectedIds.includes(item.id));

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between min-h-10 h-auto">
              <div className="flex flex-wrap gap-1 flex-1 text-left">
                {selectedItems.length > 0 ? (
                  selectedItems.map(item => (
                    <Badge key={item.id} variant="secondary" className="mr-1">
                      {item.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">{placeholder}</span>
                )}
              </div>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <ScrollArea className="h-60">
              <div className="p-2 space-y-1">
                {items.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-2 p-2 hover:bg-accent rounded cursor-pointer"
                    onClick={() => onToggle(item.id)}
                  >
                    <Checkbox checked={selectedIds.includes(item.id)} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Edit Client</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Company Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Company Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Company name"
              />
            </div>
            <div className="space-y-2">
              <Label>NIP</Label>
              <Input
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                placeholder="Tax ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
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
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Balance</Label>
              <Input
                type="number"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Classification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MultiSelectField
              label="Client Type"
              items={clientTypes}
              selectedIds={selectedClientTypes}
              onToggle={toggleClientType}
              placeholder="Select types"
            />
            <div className="space-y-2">
              <Label>Client Size</Label>
              <Select
                value={selectedClientSize || "__none__"}
                onValueChange={(value) => setSelectedClientSize(value === "__none__" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Not set</SelectItem>
                  {clientSizes.map((size) => (
                    <SelectItem key={size.id} value={size.id}>
                      {size.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <MultiSelectField
              label="Market"
              items={markets}
              selectedIds={selectedMarkets}
              onToggle={toggleMarket}
              placeholder="Select markets"
            />
            <MultiSelectField
              label="Segment"
              items={segments}
              selectedIds={selectedSegments}
              onToggle={toggleSegment}
              placeholder="Select segments"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                className="cursor-pointer"
                style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Street Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label>Postal Code</Label>
              <Input
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="Postal code"
              />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Country"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.general_email}
                onChange={(e) => setFormData({ ...formData, general_email: e.target.value })}
                placeholder="general@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.general_phone}
                onChange={(e) => setFormData({ ...formData, general_phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Primary Contact Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Primary Contact</h3>
          <p className="text-sm text-muted-foreground">
            Primary contact is managed in the Contacts tab. Mark a contact as "Primary" to set them as the main contact person.
          </p>
          {client.primary_contact_name && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-muted-foreground text-xs">Name</Label>
                <p className="text-sm font-medium">{client.primary_contact_name}</p>
              </div>
              {client.primary_contact_email && (
                <div>
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <p className="text-sm font-medium">{client.primary_contact_email}</p>
                </div>
              )}
              {client.primary_contact_phone && (
                <div>
                  <Label className="text-muted-foreground text-xs">Phone</Label>
                  <p className="text-sm font-medium">{client.primary_contact_phone}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Billing Person */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Billing Person</h3>
          <p className="text-sm text-muted-foreground">
            Billing person is managed in the Contacts tab. Add a contact with "billing" role to set them as the billing person.
          </p>
          {client.billing_person_name && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-muted-foreground text-xs">Name</Label>
                <p className="text-sm font-medium">{client.billing_person_name}</p>
              </div>
              {client.billing_person_email && (
                <div>
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <p className="text-sm font-medium">{client.billing_person_email}</p>
                </div>
              )}
              {client.billing_person_phone && (
                <div>
                  <Label className="text-muted-foreground text-xs">Phone</Label>
                  <p className="text-sm font-medium">{client.billing_person_phone}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Assignment */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Assignment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assigned Salesperson</Label>
              <Select
                value={formData.assigned_salesperson_id || "__none__"}
                onValueChange={(value) =>
                  setFormData({ ...formData, assigned_salesperson_id: value === "__none__" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select salesperson" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {salespeople.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reseller</Label>
              <Select
                value={formData.reseller_id || "__none__"}
                onValueChange={(value) =>
                  setFormData({ ...formData, reseller_id: value === "__none__" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reseller" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {resellers.map((reseller) => (
                    <SelectItem key={reseller.id} value={reseller.id}>
                      {reseller.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
