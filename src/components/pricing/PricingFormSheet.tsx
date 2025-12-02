import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  robot_model: z.string().min(1, "Robot model is required"),
  sale_price_pln_net: z.string().min(1, "PLN price is required"),
  sale_price_usd_net: z.string().min(1, "USD price is required"),
  sale_price_eur_net: z.string().min(1, "EUR price is required"),
  promo_price_pln_net: z.string().optional(),
  promo_price_usd_net: z.string().optional(),
  promo_price_eur_net: z.string().optional(),
  lowest_price_pln_net: z.string().optional(),
  lowest_price_usd_net: z.string().optional(),
  lowest_price_eur_net: z.string().optional(),
  evidence_price_pln_net: z.string().optional(),
  evidence_price_usd_net: z.string().optional(),
  evidence_price_eur_net: z.string().optional(),
  lease_pricing: z.record(z.object({
    pln: z.string().optional(),
    usd: z.string().optional(),
    eur: z.string().optional(),
    evidence_pln: z.string().optional(),
    evidence_usd: z.string().optional(),
    evidence_eur: z.string().optional(),
  })).optional(),
});

interface LeaseMonth {
  id: string;
  months: number;
}

interface LeasePricing {
  months: number;
  price_pln_net: number;
  price_usd_net: number;
  price_eur_net: number;
  evidence_price_pln_net?: number;
  evidence_price_usd_net?: number;
  evidence_price_eur_net?: number;
}

interface PricingFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pricing: any;
  onSuccess: () => void;
  isAdmin?: boolean;
}

export const PricingFormSheet = ({
  open,
  onOpenChange,
  pricing,
  onSuccess,
  isAdmin = false,
}: PricingFormSheetProps) => {
  const [robotModels, setRobotModels] = useState<string[]>([]);
  const [leaseMonths, setLeaseMonths] = useState<LeaseMonth[]>([]);
  const [existingLeaseData, setExistingLeaseData] = useState<LeasePricing[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      robot_model: "",
      sale_price_pln_net: "",
      sale_price_usd_net: "",
      sale_price_eur_net: "",
      promo_price_pln_net: "",
      promo_price_usd_net: "",
      promo_price_eur_net: "",
      lowest_price_pln_net: "",
      lowest_price_usd_net: "",
      lowest_price_eur_net: "",
      evidence_price_pln_net: "",
      evidence_price_usd_net: "",
      evidence_price_eur_net: "",
      lease_pricing: {},
    },
  });

  useEffect(() => {
    setRobotModels(["UR3", "UR5", "UR10", "UR16", "Dobot MG400", "Fanuc CRX-10iA"]);
    fetchLeaseMonths();
  }, []);

  const fetchLeaseMonths = async () => {
    const { data, error } = await supabase
      .from("lease_month_dictionary")
      .select("*")
      .order("months");

    if (!error && data) {
      setLeaseMonths(data);
    }
  };

  const fetchLeasePricing = async (pricingId: string) => {
    const { data, error } = await supabase
      .from("lease_pricing")
      .select("*")
      .eq("robot_pricing_id", pricingId);

    if (!error && data) {
      setExistingLeaseData(data);
      const leaseObj: Record<string, any> = {};
      data.forEach((item: LeasePricing) => {
        leaseObj[item.months.toString()] = {
          pln: item.price_pln_net.toString(),
          usd: item.price_usd_net.toString(),
          eur: item.price_eur_net.toString(),
          evidence_pln: item.evidence_price_pln_net?.toString() || "",
          evidence_usd: item.evidence_price_usd_net?.toString() || "",
          evidence_eur: item.evidence_price_eur_net?.toString() || "",
        };
      });
      form.setValue("lease_pricing", leaseObj);
    }
  };

  useEffect(() => {
    if (pricing) {
      form.reset({
        robot_model: pricing.robot_model,
        sale_price_pln_net: pricing.sale_price_pln_net?.toString() || "",
        sale_price_usd_net: pricing.sale_price_usd_net?.toString() || "",
        sale_price_eur_net: pricing.sale_price_eur_net?.toString() || "",
        promo_price_pln_net: pricing.promo_price_pln_net?.toString() || "",
        promo_price_usd_net: pricing.promo_price_usd_net?.toString() || "",
        promo_price_eur_net: pricing.promo_price_eur_net?.toString() || "",
        lowest_price_pln_net: pricing.lowest_price_pln_net?.toString() || "",
        lowest_price_usd_net: pricing.lowest_price_usd_net?.toString() || "",
        lowest_price_eur_net: pricing.lowest_price_eur_net?.toString() || "",
        evidence_price_pln_net: pricing.evidence_price_pln_net?.toString() || "",
        evidence_price_usd_net: pricing.evidence_price_usd_net?.toString() || "",
        evidence_price_eur_net: pricing.evidence_price_eur_net?.toString() || "",
        lease_pricing: {},
      });
      fetchLeasePricing(pricing.id);
    } else {
      form.reset({
        robot_model: "",
        sale_price_pln_net: "",
        sale_price_usd_net: "",
        sale_price_eur_net: "",
        promo_price_pln_net: "",
        promo_price_usd_net: "",
        promo_price_eur_net: "",
        lowest_price_pln_net: "",
        lowest_price_usd_net: "",
        lowest_price_eur_net: "",
        evidence_price_pln_net: "",
        evidence_price_usd_net: "",
        evidence_price_eur_net: "",
        lease_pricing: {},
      });
      setExistingLeaseData([]);
    }
  }, [pricing, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const pricingData = {
      robot_model: values.robot_model,
      sale_price_pln_net: parseFloat(values.sale_price_pln_net),
      sale_price_usd_net: parseFloat(values.sale_price_usd_net),
      sale_price_eur_net: parseFloat(values.sale_price_eur_net),
      promo_price_pln_net: values.promo_price_pln_net ? parseFloat(values.promo_price_pln_net) : null,
      promo_price_usd_net: values.promo_price_usd_net ? parseFloat(values.promo_price_usd_net) : null,
      promo_price_eur_net: values.promo_price_eur_net ? parseFloat(values.promo_price_eur_net) : null,
      lowest_price_pln_net: values.lowest_price_pln_net ? parseFloat(values.lowest_price_pln_net) : null,
      lowest_price_usd_net: values.lowest_price_usd_net ? parseFloat(values.lowest_price_usd_net) : null,
      lowest_price_eur_net: values.lowest_price_eur_net ? parseFloat(values.lowest_price_eur_net) : null,
      evidence_price_pln_net: values.evidence_price_pln_net ? parseFloat(values.evidence_price_pln_net) : null,
      evidence_price_usd_net: values.evidence_price_usd_net ? parseFloat(values.evidence_price_usd_net) : null,
      evidence_price_eur_net: values.evidence_price_eur_net ? parseFloat(values.evidence_price_eur_net) : null,
    };

    let robotPricingId: string;
    let error;

    if (pricing) {
      ({ error } = await supabase
        .from("robot_pricing")
        .update(pricingData)
        .eq("id", pricing.id));
      robotPricingId = pricing.id;
    } else {
      const { data, error: insertError } = await supabase
        .from("robot_pricing")
        .insert([pricingData])
        .select()
        .single();
      
      error = insertError;
      if (data) robotPricingId = data.id;
    }

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Handle lease pricing
    if (robotPricingId && values.lease_pricing) {
      // Delete existing lease pricing
      await supabase
        .from("lease_pricing")
        .delete()
        .eq("robot_pricing_id", robotPricingId);

      // Insert new lease pricing
      const leasePricingRecords = [];
      for (const [months, prices] of Object.entries(values.lease_pricing)) {
        if (prices.pln || prices.usd || prices.eur) {
          leasePricingRecords.push({
            robot_pricing_id: robotPricingId,
            months: parseInt(months),
            price_pln_net: prices.pln ? parseFloat(prices.pln) : 0,
            price_usd_net: prices.usd ? parseFloat(prices.usd) : 0,
            price_eur_net: prices.eur ? parseFloat(prices.eur) : 0,
            evidence_price_pln_net: prices.evidence_pln ? parseFloat(prices.evidence_pln) : null,
            evidence_price_usd_net: prices.evidence_usd ? parseFloat(prices.evidence_usd) : null,
            evidence_price_eur_net: prices.evidence_eur ? parseFloat(prices.evidence_eur) : null,
          });
        }
      }

      if (leasePricingRecords.length > 0) {
        const { error: leaseError } = await supabase
          .from("lease_pricing")
          .insert(leasePricingRecords);

        if (leaseError) {
          toast({
            title: "Warning",
            description: "Pricing saved but lease pricing failed to update",
            variant: "destructive",
          });
          return;
        }
      }
    }

    toast({
      title: "Success",
      description: `Pricing ${pricing ? "updated" : "created"} successfully`,
    });

    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pricing ? "Edit" : "Add"} Pricing</DialogTitle>
          <DialogDescription>
            {pricing ? "Update" : "Create"} pricing information for a robot model
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="robot_model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Robot Model</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!!pricing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select robot model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {robotModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Tabs defaultValue="sale" className="w-full">
              <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-3'}`}>
                <TabsTrigger value="sale">Sale</TabsTrigger>
                {isAdmin && <TabsTrigger value="evidence">Evidence</TabsTrigger>}
                <TabsTrigger value="promo">Promo</TabsTrigger>
                {isAdmin && <TabsTrigger value="lowest">Lowest</TabsTrigger>}
                <TabsTrigger value="lease">Lease</TabsTrigger>
              </TabsList>

              <TabsContent value="sale" className="space-y-3 mt-4">
                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="sale_price_pln_net"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">PLN (Net)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sale_price_usd_net"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">USD (Net)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sale_price_eur_net"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">EUR (Net)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {isAdmin && (
                <TabsContent value="evidence" className="space-y-3 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Cost/purchase price (admin-only internal pricing)
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="evidence_price_pln_net"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">PLN (Net)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="evidence_price_usd_net"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">USD (Net)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="evidence_price_eur_net"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">EUR (Net)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              )}

              <TabsContent value="promo" className="space-y-3 mt-4">
                <p className="text-sm text-muted-foreground">Optional promotional pricing</p>
                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="promo_price_pln_net"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">PLN (Net)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="promo_price_usd_net"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">USD (Net)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="promo_price_eur_net"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">EUR (Net)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {isAdmin && (
                <TabsContent value="lowest" className="space-y-3 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Admin-only pricing (not visible to other users)
                  </p>
                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="lowest_price_pln_net"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">PLN (Net)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lowest_price_usd_net"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">USD (Net)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lowest_price_eur_net"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">EUR (Net)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              )}

              <TabsContent value="lease" className="space-y-3 mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Monthly lease prices and costs for different term lengths (all net prices)
                </p>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {leaseMonths.map((leaseMonth) => (
                    <div key={leaseMonth.id} className="space-y-3 pb-4 border-b last:border-b-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-16 h-8 rounded bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">{leaseMonth.months}mo</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Lease Price</p>
                        <div className="grid grid-cols-3 gap-2">
                          <FormField
                            control={form.control}
                            name={`lease_pricing.${leaseMonth.months}.pln` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">PLN</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="0.00" className="h-9" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`lease_pricing.${leaseMonth.months}.usd` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">USD</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="0.00" className="h-9" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`lease_pricing.${leaseMonth.months}.eur` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">EUR</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="0.00" className="h-9" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {isAdmin && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Evidence (Cost)</p>
                          <div className="grid grid-cols-3 gap-2">
                            <FormField
                              control={form.control}
                              name={`lease_pricing.${leaseMonth.months}.evidence_pln` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">PLN</FormLabel>
                                  <FormControl>
                                    <Input type="number" step="0.01" placeholder="0.00" className="h-9" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`lease_pricing.${leaseMonth.months}.evidence_usd` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">USD</FormLabel>
                                  <FormControl>
                                    <Input type="number" step="0.01" placeholder="0.00" className="h-9" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`lease_pricing.${leaseMonth.months}.evidence_eur` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">EUR</FormLabel>
                                  <FormControl>
                                    <Input type="number" step="0.01" placeholder="0.00" className="h-9" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {pricing ? "Update" : "Create"} Pricing
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
