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
});

interface PricingFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pricing: any;
  onSuccess: () => void;
}

export const PricingFormSheet = ({
  open,
  onOpenChange,
  pricing,
  onSuccess,
}: PricingFormSheetProps) => {
  const [robotModels, setRobotModels] = useState<string[]>([]);
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
    },
  });

  useEffect(() => {
    // For now, using hardcoded robot models
    // In the future, this could be fetched from a dictionary table
    setRobotModels(["UR3", "UR5", "UR10", "UR16", "Dobot MG400", "Fanuc CRX-10iA"]);
  }, []);

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
      });
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
      });
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
    };

    let error;

    if (pricing) {
      ({ error } = await supabase
        .from("robot_pricing")
        .update(pricingData)
        .eq("id", pricing.id));
    } else {
      ({ error } = await supabase
        .from("robot_pricing")
        .insert([pricingData]));
    }

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Pricing ${pricing ? "updated" : "created"} successfully`,
    });

    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pricing ? "Edit" : "Add"} Pricing</DialogTitle>
          <DialogDescription>
            {pricing ? "Update" : "Create"} pricing information for a robot model
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sale">Sale Prices</TabsTrigger>
                <TabsTrigger value="promo">Promo Prices</TabsTrigger>
                <TabsTrigger value="lowest">Lowest Prices</TabsTrigger>
              </TabsList>

              <TabsContent value="sale" className="space-y-4">
                <FormField
                  control={form.control}
                  name="sale_price_pln_net"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PLN (Net)</FormLabel>
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
                      <FormLabel>USD (Net)</FormLabel>
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
                      <FormLabel>EUR (Net)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="promo" className="space-y-4">
                <FormField
                  control={form.control}
                  name="promo_price_pln_net"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PLN (Net) - Optional</FormLabel>
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
                      <FormLabel>USD (Net) - Optional</FormLabel>
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
                      <FormLabel>EUR (Net) - Optional</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="lowest" className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  These prices are only visible to administrators
                </p>
                <FormField
                  control={form.control}
                  name="lowest_price_pln_net"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PLN (Net) - Optional</FormLabel>
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
                      <FormLabel>USD (Net) - Optional</FormLabel>
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
                      <FormLabel>EUR (Net) - Optional</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
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
