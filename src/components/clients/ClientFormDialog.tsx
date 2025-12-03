import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { X, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().trim().min(1, "Company name is required").max(255, "Name must be less than 255 characters"),
  nip: z.string().trim().max(50, "NIP must be less than 50 characters").optional(),
  address: z.string().trim().max(500, "Address must be less than 500 characters").optional(),
  city: z.string().trim().max(100, "City must be less than 100 characters").optional(),
  postal_code: z.string().trim().max(20, "Postal code must be less than 20 characters").optional(),
  country: z.string().trim().max(100, "Country must be less than 100 characters").optional(),
  
  // General company info
  general_email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters").optional().or(z.literal("")),
  general_phone: z.string().trim().max(50, "Phone must be less than 50 characters").optional(),
  website_url: z.string().trim().url("Invalid URL").max(500, "URL must be less than 500 characters").optional().or(z.literal("")),
  
  // Contact person
  primary_contact_name: z.string().trim().max(255, "Name must be less than 255 characters").optional(),
  primary_contact_email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters").optional().or(z.literal("")),
  primary_contact_phone: z.string().trim().max(50, "Phone must be less than 50 characters").optional(),
  
  // Billing person
  billing_person_name: z.string().trim().max(255, "Name must be less than 255 characters").optional(),
  billing_person_email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters").optional().or(z.literal("")),
  billing_person_phone: z.string().trim().max(50, "Phone must be less than 50 characters").optional(),
  
  // Financial and status
  balance: z.number().optional(),
  status: z.enum(["active", "inactive", "blocked"]).default("active"),
  reseller_id: z.string().optional(),
  assigned_salesperson_id: z.string().optional(),
});

interface DictionaryItem {
  id: string;
  name: string;
}

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newClientId?: string) => void;
  client?: any;
}

export function ClientFormDialog({ open, onOpenChange, onSuccess, client }: ClientFormDialogProps) {
  const isEditMode = !!client;
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
  const [selectedClientSizes, setSelectedClientSizes] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      nip: "",
      address: "",
      city: "",
      postal_code: "",
      country: "Poland",
      general_email: "",
      general_phone: "",
      website_url: "",
      primary_contact_name: "",
      primary_contact_email: "",
      primary_contact_phone: "",
      billing_person_name: "",
      billing_person_email: "",
      billing_person_phone: "",
      balance: 0,
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      fetchTags();
      fetchResellers();
      fetchSalespeople();
      fetchDictionaries();
      if (client) {
        fetchClientTags();
        fetchClientClassifications();
        form.reset({
          name: client.name || "",
          nip: client.nip || "",
          address: client.address || "",
          city: client.city || "",
          postal_code: client.postal_code || "",
          country: client.country || "Poland",
          general_email: client.general_email || "",
          general_phone: client.general_phone || "",
          website_url: client.website_url || "",
          primary_contact_name: client.primary_contact_name || "",
          primary_contact_email: client.primary_contact_email || "",
          primary_contact_phone: client.primary_contact_phone || "",
          billing_person_name: client.billing_person_name || "",
          billing_person_email: client.billing_person_email || "",
          billing_person_phone: client.billing_person_phone || "",
          balance: client.balance || 0,
          status: client.status || "active",
          reseller_id: client.reseller_id || "",
          assigned_salesperson_id: client.assigned_salesperson_id || "",
      });
    } else {
      setSelectedTags([]);
      setSelectedClientTypes([]);
      setSelectedMarkets([]);
      setSelectedSegments([]);
      setSelectedClientSizes([]);
      form.reset({
        name: "",
        nip: "",
        address: "",
        city: "",
        postal_code: "",
        country: "Poland",
        general_email: "",
        general_phone: "",
        website_url: "",
        primary_contact_name: "",
        primary_contact_email: "",
        primary_contact_phone: "",
        billing_person_name: "",
        billing_person_email: "",
        billing_person_phone: "",
        balance: 0,
        status: "active",
        reseller_id: "",
        assigned_salesperson_id: "",
      });
    }
    }
  }, [open, client]);

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
    if (!client?.id) return;
    
    const [typesRes, marketsRes, segmentsRes, sizesRes] = await Promise.all([
      supabase.from("client_client_types").select("client_type_id").eq("client_id", client.id),
      supabase.from("client_markets").select("market_id").eq("client_id", client.id),
      supabase.from("client_segments").select("segment_id").eq("client_id", client.id),
      supabase.from("client_sizes").select("size_id").eq("client_id", client.id),
    ]);
    
    if (typesRes.data) setSelectedClientTypes(typesRes.data.map(t => t.client_type_id));
    if (marketsRes.data) setSelectedMarkets(marketsRes.data.map(m => m.market_id));
    if (segmentsRes.data) setSelectedSegments(segmentsRes.data.map(s => s.segment_id));
    if (sizesRes.data) setSelectedClientSizes(sizesRes.data.map(s => s.size_id));
  };

  const fetchSalespeople = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");

    if (data && !error) {
      setSalespeople(data);
    }
  };

  const fetchTags = async () => {
    const { data } = await supabase
      .from("client_tags")
      .select("*")
      .order("name");
    
    if (data) {
      setAvailableTags(data);
    }
  };

  const fetchResellers = async () => {
    const { data } = await supabase
      .from("resellers")
      .select("id, name")
      .eq("status", "active")
      .order("name");
    
    if (data) {
      setResellers(data);
    }
  };

  const fetchClientTags = async () => {
    if (!client?.id) return;
    
    const { data } = await supabase
      .from("client_assigned_tags")
      .select("tag_id")
      .eq("client_id", client.id);
    
    if (data) {
      setSelectedTags(data.map(t => t.tag_id));
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const toggleClientType = (typeId: string) => {
    setSelectedClientTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const toggleMarket = (marketId: string) => {
    setSelectedMarkets(prev =>
      prev.includes(marketId)
        ? prev.filter(id => id !== marketId)
        : [...prev, marketId]
    );
  };

  const toggleSegment = (segmentId: string) => {
    setSelectedSegments(prev =>
      prev.includes(segmentId)
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  const toggleClientSize = (sizeId: string) => {
    setSelectedClientSizes(prev =>
      prev.includes(sizeId)
        ? prev.filter(id => id !== sizeId)
        : [...prev, sizeId]
    );
  };

  const saveClientClassifications = async (clientId: string) => {
    // Delete existing and insert new for all classification types
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
    
    if (selectedClientSizes.length > 0) {
      insertPromises.push(
        supabase.from("client_sizes").insert(
          selectedClientSizes.map(sizeId => ({ client_id: clientId, size_id: sizeId }))
        )
      );
    }
    
    await Promise.all(insertPromises);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      const clientData = {
        name: values.name,
        nip: values.nip || null,
        address: values.address || null,
        city: values.city || null,
        postal_code: values.postal_code || null,
        country: values.country || null,
        general_email: values.general_email || null,
        general_phone: values.general_phone || null,
        website_url: values.website_url || null,
        primary_contact_name: values.primary_contact_name || null,
        primary_contact_email: values.primary_contact_email || null,
        primary_contact_phone: values.primary_contact_phone || null,
        billing_person_name: values.billing_person_name || null,
        billing_person_email: values.billing_person_email || null,
        billing_person_phone: values.billing_person_phone || null,
        balance: values.balance || 0,
        status: values.status,
        reseller_id: values.reseller_id || null,
        assigned_salesperson_id: values.assigned_salesperson_id || null,
      };

      if (isEditMode) {
        const { error } = await supabase
          .from("clients")
          .update(clientData)
          .eq("id", client.id);

        if (error) throw error;

        // Update tags
        await supabase
          .from("client_assigned_tags")
          .delete()
          .eq("client_id", client.id);

        if (selectedTags.length > 0) {
          await supabase
            .from("client_assigned_tags")
            .insert(selectedTags.map(tagId => ({
              client_id: client.id,
              tag_id: tagId,
            })));
        }

        // Save classifications
        await saveClientClassifications(client.id);

        toast({
          title: "Client updated",
          description: `${values.name} has been updated successfully`,
        });

        form.reset();
        setSelectedTags([]);
        setSelectedClientTypes([]);
        setSelectedMarkets([]);
        setSelectedSegments([]);
        setSelectedClientSizes([]);
        onSuccess?.(client.id);
        onOpenChange(false);
      } else {
        const { data: session } = await supabase.auth.getSession();
        
        const { data: newClient, error } = await supabase
          .from("clients")
          .insert({
            ...clientData,
            assigned_salesperson_id: session?.session?.user?.id,
          })
          .select()
          .single();

        if (error) throw error;

        // Insert tags
        if (selectedTags.length > 0 && newClient) {
          await supabase
            .from("client_assigned_tags")
            .insert(selectedTags.map(tagId => ({
              client_id: newClient.id,
              tag_id: tagId,
            })));
        }

        // Save classifications
        if (newClient) {
          await saveClientClassifications(newClient.id);
        }

        toast({
          title: "Client created",
          description: `${values.name} has been created successfully`,
        });

        form.reset();
        setSelectedTags([]);
        setSelectedClientTypes([]);
        setSelectedMarkets([]);
        setSelectedSegments([]);
        setSelectedClientSizes([]);
        onSuccess?.(newClient?.id);
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({
        title: isEditMode ? "Error updating client" : "Error creating client",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const MultiSelectField = ({ 
    label, 
    items, 
    selectedIds, 
    onToggle,
    placeholder 
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
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between min-h-10 h-auto"
            >
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
                    <Checkbox
                      checked={selectedIds.includes(item.id)}
                      onCheckedChange={() => onToggle(item.id)}
                    />
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{isEditMode ? "Edit Client" : "New Client"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update client information and contact details"
              : "Add a new client with company and contact information"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Company Information</h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIP</FormLabel>
                        <FormControl>
                          <Input placeholder="Tax ID number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Postal code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* General Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">General Contact</h3>
                
                <FormField
                  control={form.control}
                  name="general_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="info@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="general_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Phone</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+48 123 456 789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Classification - Multi-select */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Classification</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MultiSelectField
                    label="Client Type"
                    items={clientTypes}
                    selectedIds={selectedClientTypes}
                    onToggle={toggleClientType}
                    placeholder="Select client types"
                  />

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

                  <MultiSelectField
                    label="Client Size"
                    items={clientSizes}
                    selectedIds={selectedClientSizes}
                    onToggle={toggleClientSize}
                    placeholder="Select client sizes"
                  />
                </div>
              </div>

              <Separator />

              {/* Contact Person */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Person</h3>
                
                <FormField
                  control={form.control}
                  name="primary_contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact person name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="primary_contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="primary_contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+48 123 456 789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Billing Person */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Billing Contact</h3>
                
                <FormField
                  control={form.control}
                  name="billing_person_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Billing person name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="billing_person_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="billing@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billing_person_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+48 123 456 789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Financial and Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Financial & Status</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Balance (PLN)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="blocked">Blocked</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="reseller_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reseller</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)} 
                          value={field.value || "__none__"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reseller" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">None</SelectItem>
                            {resellers.map((reseller) => (
                              <SelectItem key={reseller.id} value={reseller.id}>
                                {reseller.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assigned_salesperson_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned Salesperson</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)} 
                          value={field.value || "__none__"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select salesperson" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">None</SelectItem>
                            {salespeople.map((person) => (
                              <SelectItem key={person.id} value={person.id}>
                                {person.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Tags */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tags</h3>
                
                <div className="space-y-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {selectedTags.length > 0
                          ? `${selectedTags.length} tag(s) selected`
                          : "Select tags"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <ScrollArea className="h-60">
                        <div className="p-2 space-y-1">
                          {availableTags.map((tag) => (
                            <div
                              key={tag.id}
                              className="flex items-center space-x-2 p-2 hover:bg-accent rounded cursor-pointer"
                              onClick={() => toggleTag(tag.id)}
                            >
                              <Checkbox
                                checked={selectedTags.includes(tag.id)}
                                onCheckedChange={() => toggleTag(tag.id)}
                              />
                              <Badge
                                variant="outline"
                                style={{ 
                                  borderColor: tag.color,
                                  color: tag.color 
                                }}
                              >
                                {tag.name}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>

                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tagId) => {
                        const tag = availableTags.find((t) => t.id === tagId);
                        if (!tag) return null;
                        return (
                          <Badge
                            key={tagId}
                            variant="outline"
                            style={{ 
                              borderColor: tag.color,
                              color: tag.color 
                            }}
                            className="cursor-pointer"
                            onClick={() => toggleTag(tagId)}
                          >
                            {tag.name}
                            <X className="ml-1 h-3 w-3" />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                    ? "Update Client"
                    : "Create Client"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
