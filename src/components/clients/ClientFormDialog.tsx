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
});

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  client?: any;
}

export function ClientFormDialog({ open, onOpenChange, onSuccess, client }: ClientFormDialogProps) {
  const isEditMode = !!client;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    },
  });

  useEffect(() => {
    if (open && client) {
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
      });
    } else if (open && !client) {
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
      });
    }
  }, [open, client]);

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
      };

      if (isEditMode) {
        const { error } = await supabase
          .from("clients")
          .update(clientData)
          .eq("id", client.id);

        if (error) throw error;

        toast({
          title: "Client updated",
          description: `${values.name} has been updated successfully`,
        });
      } else {
        const { data: session } = await supabase.auth.getSession();
        
        const { error } = await supabase
          .from("clients")
          .insert({
            ...clientData,
            assigned_salesperson_id: session?.session?.user?.id,
          });

        if (error) throw error;

        toast({
          title: "Client created",
          description: `${values.name} has been created successfully`,
        });
      }

      form.reset();
      onSuccess?.();
      onOpenChange(false);
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
