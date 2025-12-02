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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientCombobox } from "@/components/ui/client-combobox";

const formSchema = z.object({
  client_id: z.string().min(1, "Client is required"),
  person_contact: z.string().optional(),
  currency: z.enum(["PLN", "USD", "EUR"]),
  warranty_period: z.number().min(0).default(12),
  delivery_date: z.date().optional(),
  deployment_location: z.string().optional(),
  initial_payment: z.number().min(0).default(0),
  prepayment_type: z.enum(["none", "percent", "amount"]).default("none"),
  prepayment_value: z.number().min(0).optional(),
  stage: z.enum(["leads", "qualified", "proposal_sent", "negotiation", "closed_won", "closed_lost"]).default("leads"),
  reseller_id: z.string().optional(),
});

interface RobotSelection {
  id: string;
  robot_model: string;
  contract_type: "purchase" | "lease";
  lease_months?: number;
  price: number;
  warranty_months?: number;
  warranty_price?: number;
}

interface Client {
  id: string;
  name: string;
  primary_contact_name?: string;
}

interface RobotPricing {
  id: string;
  robot_model: string;
  sale_price_pln_net: number;
  sale_price_usd_net: number;
  sale_price_eur_net: number;
}

interface LeasePricing {
  months: number;
  price_pln_net: number;
  price_usd_net: number;
  price_eur_net: number;
  robot_pricing_id: string;
}

interface OfferData {
  id: string;
  client_id: string;
  person_contact?: string;
  currency: string;
  warranty_period: number;
  delivery_date?: string;
  deployment_location?: string;
  initial_payment: number;
  prepayment_percent?: number;
  prepayment_amount?: number;
  offer_number: string;
  stage: string;
}

interface NewOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  offer?: OfferData | null;
}

export function NewOfferDialog({ open, onOpenChange, onSuccess, offer }: NewOfferDialogProps) {
  const isEditMode = !!offer;
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [robotPricing, setRobotPricing] = useState<RobotPricing[]>([]);
  const [leasePricing, setLeasePricing] = useState<LeasePricing[]>([]);
  const [availableLeaseMonths, setAvailableLeaseMonths] = useState<number[]>([]);
  const [robotSelections, setRobotSelections] = useState<RobotSelection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resellers, setResellers] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currency: "PLN",
      warranty_period: 12,
      initial_payment: 0,
      prepayment_type: "none",
      stage: "leads",
    },
  });

  useEffect(() => {
    if (open) {
      fetchClients();
      fetchPricing();
      fetchResellers();
      if (offer) {
        loadOfferData();
      } else {
        form.reset({
          currency: "PLN",
          warranty_period: 12,
          initial_payment: 0,
          prepayment_type: "none",
          stage: "leads",
        });
        setRobotSelections([]);
      }
    }
  }, [open, offer]);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("id, name, primary_contact_name")
      .order("name");

    if (error) {
      toast({
        title: "Error loading clients",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setClients(data || []);
  };

  const fetchResellers = async () => {
    const { data, error } = await supabase
      .from("resellers")
      .select("id, name")
      .eq("status", "active")
      .order("name");

    if (error) {
      toast({
        title: "Error loading resellers",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setResellers(data || []);
  };

  const loadOfferData = async () => {
    if (!offer) return;

    // Fetch offer items
    const { data: items, error: itemsError } = await supabase
      .from("offer_items")
      .select("*")
      .eq("offer_id", offer.id);

    if (itemsError) {
      toast({
        title: "Error loading offer items",
        description: itemsError.message,
        variant: "destructive",
      });
      return;
    }

    // Populate form with offer data
    const prepaymentType = offer.prepayment_percent
      ? "percent"
      : offer.prepayment_amount
      ? "amount"
      : "none";

    form.reset({
      client_id: offer.client_id,
      person_contact: offer.person_contact || "",
      currency: offer.currency as "PLN" | "USD" | "EUR",
      warranty_period: offer.warranty_period,
      delivery_date: offer.delivery_date ? new Date(offer.delivery_date) : undefined,
      deployment_location: offer.deployment_location || "",
      initial_payment: offer.initial_payment,
      prepayment_type: prepaymentType as "none" | "percent" | "amount",
      prepayment_value: offer.prepayment_percent || offer.prepayment_amount || 0,
      stage: offer.stage as "leads" | "qualified" | "proposal_sent" | "negotiation" | "closed_won" | "closed_lost",
      reseller_id: (offer as any).reseller_id || "",
    });

    // Populate robot selections
    const robotSels: RobotSelection[] = items.map((item) => ({
      id: item.id,
      robot_model: item.robot_model,
      contract_type: item.contract_type as "purchase" | "lease",
      lease_months: item.lease_months || undefined,
      price: Number(item.unit_price),
      warranty_months: item.warranty_months || undefined,
      warranty_price: item.warranty_price || undefined,
    }));

    setRobotSelections(robotSels);
  };

  const fetchPricing = async () => {
    const { data: pricingData, error: pricingError } = await supabase
      .from("robot_pricing")
      .select("*")
      .order("robot_model");

    if (pricingError) {
      toast({
        title: "Error loading pricing",
        description: pricingError.message,
        variant: "destructive",
      });
      return;
    }

    setRobotPricing(pricingData || []);

    const { data: leaseData, error: leaseError } = await supabase
      .from("lease_pricing")
      .select("*")
      .order("months");

    if (leaseError) {
      toast({
        title: "Error loading lease pricing",
        description: leaseError.message,
        variant: "destructive",
      });
      return;
    }

    setLeasePricing(leaseData || []);

    const uniqueMonths = Array.from(new Set(leaseData?.map((l) => l.months) || [])).sort(
      (a, b) => a - b
    );
    setAvailableLeaseMonths(uniqueMonths);
  };

  const addRobotSelection = () => {
    const newSelection: RobotSelection = {
      id: Math.random().toString(),
      robot_model: "",
      contract_type: "purchase",
      price: 0,
    };
    setRobotSelections([...robotSelections, newSelection]);
  };

  const removeRobotSelection = (id: string) => {
    setRobotSelections(robotSelections.filter((r) => r.id !== id));
  };

  const updateRobotSelection = (id: string, updates: Partial<RobotSelection>) => {
    setRobotSelections(
      robotSelections.map((r) => {
        if (r.id === id) {
          const updated = { ...r, ...updates };
          
          // Auto-calculate price when robot model or contract type changes
          if (updates.robot_model || updates.contract_type || updates.lease_months) {
            const currency = form.getValues("currency");
            updated.price = calculateRobotPrice(
              updated.robot_model,
              updated.contract_type,
              currency,
              updated.lease_months
            );
          }
          
          return updated;
        }
        return r;
      })
    );
  };

  const calculateRobotPrice = (
    robotModel: string,
    contractType: "purchase" | "lease",
    currency: string,
    leaseMonths?: number
  ): number => {
    if (!robotModel) return 0;

    const pricing = robotPricing.find((p) => p.robot_model === robotModel);
    if (!pricing) return 0;

    if (contractType === "purchase") {
      if (currency === "PLN") return Number(pricing.sale_price_pln_net);
      if (currency === "USD") return Number(pricing.sale_price_usd_net);
      if (currency === "EUR") return Number(pricing.sale_price_eur_net);
    } else if (contractType === "lease" && leaseMonths) {
      const lease = leasePricing.find(
        (l) => l.robot_pricing_id === pricing.id && l.months === leaseMonths
      );
      if (lease) {
        if (currency === "PLN") return Number(lease.price_pln_net);
        if (currency === "USD") return Number(lease.price_usd_net);
        if (currency === "EUR") return Number(lease.price_eur_net);
      }
    }

    return 0;
  };

  const calculateTotalPrice = () => {
    const robotTotal = robotSelections.reduce((sum, robot) => {
      let robotPrice = robot.price;
      if (robot.warranty_months && robot.warranty_price) {
        robotPrice += robot.warranty_price;
      }
      return sum + robotPrice;
    }, 0);

    const prepaymentType = form.getValues("prepayment_type");
    const prepaymentValue = form.getValues("prepayment_value") || 0;
    
    let prepaymentAmount = 0;
    if (prepaymentType === "percent") {
      prepaymentAmount = (robotTotal * prepaymentValue) / 100;
    } else if (prepaymentType === "amount") {
      prepaymentAmount = prepaymentValue;
    }

    const initialPayment = form.getValues("initial_payment") || 0;
    
    return robotTotal - prepaymentAmount - initialPayment;
  };

  const createContractFromOffer = async (
    offerId: string,
    clientId: string,
    items: RobotSelection[]
  ) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      // Generate contract number
      const { data: lastContract } = await supabase
        .from("contracts")
        .select("contract_number")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let contractNumber = "CON-00001";
      if (lastContract?.contract_number) {
        const match = lastContract.contract_number.match(/\d+$/);
        if (match) {
          const nextNumber = parseInt(match[0]) + 1;
          contractNumber = `CON-${String(nextNumber).padStart(5, "0")}`;
        }
      }

      // Calculate contract details
      const leaseItems = items.filter(item => item.contract_type === "lease");
      const hasLease = leaseItems.length > 0;
      
      let monthlyPayment = 0;
      let endDate = null;
      let paymentModel = "purchase";
      
      if (hasLease) {
        const totalPrice = leaseItems.reduce((sum, item) => sum + item.price, 0);
        const leaseMonths = leaseItems[0].lease_months || 12;
        monthlyPayment = totalPrice / leaseMonths;
        paymentModel = "lease";
        
        const start = new Date();
        start.setMonth(start.getMonth() + leaseMonths);
        endDate = start.toISOString().split('T')[0];
      }

      // Fetch billing schedule from settings
      const { data: settingsData } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "lease_billing_schedule")
        .maybeSingle();
      
      const billingSchedule = settingsData?.value || "monthly";

      // Create contract
      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .insert([{
          contract_number: contractNumber,
          client_id: clientId,
          status: "draft",
          start_date: new Date().toISOString().split('T')[0],
          end_date: endDate,
          monthly_payment: monthlyPayment,
          payment_model: paymentModel,
          billing_schedule: billingSchedule,
          created_by: session?.session?.user?.id,
        }])
        .select()
        .single();

      if (contractError) throw contractError;

      // Show success message with link to contract
      toast({
        title: "Offer Accepted & Contract Created",
        description: (
          <div className="space-y-2">
            <p>Contract {contractNumber} has been created from this offer.</p>
            <Button
              variant="link"
              className="p-0 h-auto text-primary"
              onClick={() => {
                window.location.href = `/contracts/${contract.id}`;
              }}
            >
              View Contract →
            </Button>
          </div>
        ),
        duration: 10000,
      });
    } catch (error: any) {
      console.error("Error creating contract:", error);
      toast({
        title: "Contract Creation Failed",
        description: "Offer was updated but contract creation failed: " + error.message,
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (robotSelections.length === 0) {
      toast({
        title: "No robots selected",
        description: "Please add at least one robot to the offer",
        variant: "destructive",
      });
      return;
    }

    // Validate all robots have required fields
    const invalidRobots = robotSelections.filter(
      (r) => !r.robot_model || (r.contract_type === "lease" && !r.lease_months)
    );
    if (invalidRobots.length > 0) {
      toast({
        title: "Incomplete robot selections",
        description: "Please complete all robot details",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Calculate prepayment
      let prepaymentPercent = null;
      let prepaymentAmount = null;
      if (values.prepayment_type === "percent") {
        prepaymentPercent = values.prepayment_value;
      } else if (values.prepayment_type === "amount") {
        prepaymentAmount = values.prepayment_value;
      }

      const offerData = {
        client_id: values.client_id,
        currency: values.currency,
        person_contact: values.person_contact,
        initial_payment: values.initial_payment,
        prepayment_percent: prepaymentPercent,
        prepayment_amount: prepaymentAmount,
        warranty_period: values.warranty_period,
        delivery_date: values.delivery_date?.toISOString().split("T")[0],
        deployment_location: values.deployment_location,
        total_price: calculateTotalPrice(),
        reseller_id: values.reseller_id || null,
      };

      if (isEditMode && offer) {
        // Check if stage changed to closed_won
        const stageChangedToWon = offer.stage !== "closed_won" && values.stage === "closed_won";
        
        // Update existing offer
        const { error: offerError } = await supabase
          .from("offers")
          .update({
            ...offerData,
            stage: values.stage,
          })
          .eq("id", offer.id);

        if (offerError) throw offerError;

        // Delete existing offer items
        const { error: deleteError } = await supabase
          .from("offer_items")
          .delete()
          .eq("offer_id", offer.id);

        if (deleteError) throw deleteError;

        // Create new offer items
        const offerItems = robotSelections.map((robot) => ({
          offer_id: offer.id,
          robot_model: robot.robot_model,
          quantity: 1,
          unit_price: robot.price,
          contract_type: robot.contract_type,
          lease_months: robot.lease_months,
          warranty_months: robot.warranty_months,
          warranty_price: robot.warranty_price || 0,
        }));

        const { error: itemsError } = await supabase
          .from("offer_items")
          .insert(offerItems);

        if (itemsError) throw itemsError;

        // Auto-create contract if stage changed to closed_won
        if (stageChangedToWon) {
          await createContractFromOffer(offer.id, values.client_id, robotSelections);
        } else {
          toast({
            title: "Offer updated",
            description: `Offer ${offer.offer_number} has been updated successfully`,
          });
        }
      } else {
        // Create new offer
        const offerNumber = `OFF-${Date.now()}`;
        
        const { data: newOffer, error: offerError } = await supabase
          .from("offers")
          .insert({
            ...offerData,
            created_by: user.id,
            offer_number: offerNumber,
            stage: "leads",
          })
          .select()
          .single();

        if (offerError) throw offerError;

        // Create offer items
        const offerItems = robotSelections.map((robot) => ({
          offer_id: newOffer.id,
          robot_model: robot.robot_model,
          quantity: 1,
          unit_price: robot.price,
          contract_type: robot.contract_type,
          lease_months: robot.lease_months,
          warranty_months: robot.warranty_months,
          warranty_price: robot.warranty_price || 0,
        }));

        const { error: itemsError } = await supabase
          .from("offer_items")
          .insert(offerItems);

        if (itemsError) throw itemsError;

        toast({
          title: "Offer created",
          description: `Offer ${offerNumber} has been created successfully`,
        });
      }

      form.reset();
      setRobotSelections([]);
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: isEditMode ? "Error updating offer" : "Error creating offer",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{isEditMode ? "Edit Offer" : "New Offer"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update offer details, robots, pricing, and delivery information"
              : "Create a new offer with robots, pricing, and delivery details"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6">
              {/* Client and Contact */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <FormControl>
                        <ClientCombobox
                          clients={clients}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select client"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="person_contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact person name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reseller_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reseller Partner (Optional)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "none" ? undefined : value)} 
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reseller" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Reseller</SelectItem>
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
              </div>

              {/* Currency and Status */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PLN">PLN</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isEditMode && (
                  <FormField
                    control={form.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Funnel Stage *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="leads">Leads</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                            <SelectItem value="negotiation">Negotiation</SelectItem>
                            <SelectItem value="closed_won">Closed Won</SelectItem>
                            <SelectItem value="closed_lost">Closed Lost</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Robots Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Robots</h3>
                  <Button type="button" onClick={addRobotSelection} variant="outline" size="sm">
                    Add Robot
                  </Button>
                </div>

                {robotSelections.map((robot) => (
                  <div key={robot.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Robot Configuration</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRobotSelection(robot.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FormLabel>Robot Model *</FormLabel>
                        <Select
                          value={robot.robot_model}
                          onValueChange={(value) =>
                            updateRobotSelection(robot.id, { robot_model: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select robot" />
                          </SelectTrigger>
                          <SelectContent>
                            {robotPricing.map((pricing) => (
                              <SelectItem key={pricing.id} value={pricing.robot_model}>
                                {pricing.robot_model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <FormLabel>Contract Type *</FormLabel>
                        <Select
                          value={robot.contract_type}
                          onValueChange={(value: "purchase" | "lease") =>
                            updateRobotSelection(robot.id, { contract_type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="purchase">Purchase</SelectItem>
                            <SelectItem value="lease">Lease</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {robot.contract_type === "lease" && (
                      <div>
                        <FormLabel>Lease Plan *</FormLabel>
                        <Select
                          value={robot.lease_months?.toString()}
                          onValueChange={(value) =>
                            updateRobotSelection(robot.id, { lease_months: parseInt(value) })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select months" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableLeaseMonths.map((months) => (
                              <SelectItem key={months} value={months.toString()}>
                                {months} months
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {robot.contract_type === "purchase" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <FormLabel>Warranty (months)</FormLabel>
                          <Input
                            type="number"
                            placeholder="0"
                            value={robot.warranty_months || ""}
                            onChange={(e) =>
                              updateRobotSelection(robot.id, {
                                warranty_months: parseInt(e.target.value) || undefined,
                              })
                            }
                          />
                        </div>
                        <div>
                          <FormLabel>Warranty Price</FormLabel>
                          <Input
                            type="number"
                            placeholder="0"
                            value={robot.warranty_price || ""}
                            onChange={(e) =>
                              updateRobotSelection(robot.id, {
                                warranty_price: parseFloat(e.target.value) || undefined,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <FormLabel>Price</FormLabel>
                      <Input
                        type="number"
                        value={robot.price}
                        onChange={(e) =>
                          updateRobotSelection(robot.id, { price: parseFloat(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Payment Details</h3>
                
                <FormField
                  control={form.control}
                  name="initial_payment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Payment (for lease)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="prepayment_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prepayment Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="percent">Percent</SelectItem>
                            <SelectItem value="amount">Amount</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("prepayment_type") !== "none" && (
                    <FormField
                      control={form.control}
                      name="prepayment_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {form.watch("prepayment_type") === "percent" ? "Percent (%)" : "Amount"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              {/* Delivery Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Delivery Details</h3>
                
                <FormField
                  control={form.control}
                  name="warranty_period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warranty Period (months)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 12)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="delivery_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Requested Delivery Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deployment_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deployment Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Price:</span>
                  <span>
                    {calculateTotalPrice().toFixed(2)} {form.watch("currency")}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 sticky bottom-0 bg-background pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                    ? "Update Offer"
                    : "Create Offer"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
