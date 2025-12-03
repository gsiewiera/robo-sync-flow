import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ClientCombobox } from "@/components/ui/client-combobox";

const formSchema = z.object({
  client_id: z.string().min(1, "Client is required"),
  robot_id: z.string().min(1, "Robot is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  assigned_to: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Client {
  id: string;
  name: string;
}

interface Robot {
  id: string;
  serial_number: string;
  model: string;
}

interface Profile {
  id: string;
  full_name: string;
}

interface TicketFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialClientId?: string;
  initialRobotId?: string;
}

export function TicketFormDialog({
  open,
  onOpenChange,
  onSuccess,
  initialClientId,
  initialRobotId,
}: TicketFormDialogProps) {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: initialClientId || "",
      robot_id: initialRobotId || "",
      title: "",
      description: "",
      priority: "medium",
      status: "open",
      assigned_to: "",
    },
  });

  const selectedClientId = form.watch("client_id");

  useEffect(() => {
    if (open) {
      fetchClients();
      fetchProfiles();
      form.reset({
        client_id: initialClientId || "",
        robot_id: initialRobotId || "",
        title: "",
        description: "",
        priority: "medium",
        status: "open",
        assigned_to: "",
      });
    }
  }, [open, initialClientId, initialRobotId]);

  useEffect(() => {
    if (selectedClientId) {
      fetchRobots(selectedClientId);
    } else {
      setRobots([]);
      form.setValue("robot_id", "");
    }
  }, [selectedClientId]);

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("id, name")
      .order("name");
    if (data) setClients(data);
  };

  const fetchRobots = async (clientId: string) => {
    const { data } = await supabase
      .from("robots")
      .select("id, serial_number, model")
      .eq("client_id", clientId)
      .order("serial_number");
    if (data) setRobots(data);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");
    if (data) setProfiles(data);
  };

  const generateTicketNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const { data } = await supabase
      .from("service_tickets")
      .select("ticket_number")
      .ilike("ticket_number", `SRV-${year}-%`)
      .order("ticket_number", { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].ticket_number.split("-")[2]);
      nextNumber = lastNumber + 1;
    }
    return `SRV-${year}-${nextNumber.toString().padStart(4, "0")}`;
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const ticketNumber = await generateTicketNumber();

      const { error } = await supabase.from("service_tickets").insert({
        ticket_number: ticketNumber,
        client_id: values.client_id,
        robot_id: values.robot_id,
        title: values.title,
        description: values.description || null,
        priority: values.priority,
        status: values.status,
        assigned_to: values.assigned_to || null,
      });

      if (error) throw error;

      toast({ title: "Service ticket created successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error creating ticket",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Service Ticket</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      placeholder="Select client..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="robot_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Robot *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!selectedClientId || robots.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !selectedClientId 
                            ? "Select a client first" 
                            : robots.length === 0 
                              ? "No robots for this client" 
                              : "Select robot..."
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {robots.map((robot) => (
                        <SelectItem key={robot.id} value={robot.id}>
                          {robot.serial_number} - {robot.model}
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Brief description of the issue" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Detailed description of the issue..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assigned_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Ticket"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
