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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ClientCombobox } from "@/components/ui/client-combobox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskTitleDictionary {
  id: string;
  title: string;
}

interface MeetingTypeDictionary {
  id: string;
  type_name: string;
}

interface Profile {
  id: string;
  full_name: string;
}

interface Client {
  id: string;
  name: string;
}

interface Contract {
  id: string;
  contract_number: string;
  client_id: string;
}

interface Offer {
  id: string;
  offer_number: string;
  client_id: string;
}

interface Robot {
  id: string;
  type: string;
  model: string;
  serial_number: string;
  client_id: string | null;
}

const taskFormSchema = z.object({
  title: z.string().min(1, "Task is required"),
  description: z.string().optional(),
  due_date: z.date().optional(),
  status: z.enum(["pending", "in_progress", "completed", "overdue"]),
  assigned_to: z.string().optional(),
  client_id: z.string().optional(),
  contract_id: z.string().optional(),
  robot_ids: z.array(z.string()).optional(),
  offer_id: z.string().optional(),
  meeting_type: z.string().optional(),
  person_to_meet: z.string().optional(),
  meeting_date_time: z.date().optional(),
  place: z.string().optional(),
  reminder_date_time: z.date().optional(),
  notes: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  taskId?: string;
  mode?: "create" | "view" | "edit";
}

export const TaskFormSheet = ({ open, onOpenChange, onSuccess, taskId, mode = "create" }: TaskFormSheetProps) => {
  const [taskTitles, setTaskTitles] = useState<TaskTitleDictionary[]>([]);
  const [meetingTypes, setMeetingTypes] = useState<MeetingTypeDictionary[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [filteredRobots, setFilteredRobots] = useState<Robot[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(mode === "edit");
  const [isLoading, setIsLoading] = useState(false);
  const [taskCreatedAt, setTaskCreatedAt] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "pending",
      assigned_to: undefined,
      client_id: undefined,
      contract_id: undefined,
      robot_ids: [],
      offer_id: undefined,
      meeting_type: undefined,
      person_to_meet: "",
      meeting_date_time: undefined,
      place: "",
      reminder_date_time: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    fetchTaskTitles();
    fetchMeetingTypes();
    fetchEmployees();
    fetchClients();
    fetchContracts();
    fetchOffers();
    fetchRobots();
    checkUserRole();
  }, []);

  useEffect(() => {
    if (open) {
      // Always reset isEditing based on mode when dialog opens
      setIsEditing(mode === "edit");
      
      if (taskId) {
        fetchTaskData();
      } else {
        form.reset();
        setTaskCreatedAt(null);
      }
    }
  }, [taskId, open, mode]);

  // Filter contracts, offers, and robots when client changes
  const selectedClientId = form.watch("client_id");
  const selectedTaskTitle = form.watch("title");
  const selectedMeetingDateTime = form.watch("meeting_date_time");

  useEffect(() => {
    if (selectedClientId) {
      setFilteredContracts(contracts.filter(c => c.client_id === selectedClientId));
      setFilteredOffers(offers.filter(o => o.client_id === selectedClientId));
      setFilteredRobots(robots.filter(r => r.client_id === selectedClientId));
    } else {
      setFilteredContracts([]);
      setFilteredOffers([]);
      setFilteredRobots([]);
    }
  }, [selectedClientId, contracts, offers, robots]);

  // Auto-calculate reminder date (3 hours before meeting) for Client meeting and Site Visit
  useEffect(() => {
    if (selectedMeetingDateTime && (selectedTaskTitle === "Client meeting" || selectedTaskTitle === "Site Visit")) {
      const reminderDate = new Date(selectedMeetingDateTime);
      reminderDate.setHours(reminderDate.getHours() - 3);
      form.setValue("reminder_date_time", reminderDate);
    }
  }, [selectedMeetingDateTime, selectedTaskTitle]);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setUserRole(data.role);
    }
  };

  const fetchTaskTitles = async () => {
    const { data } = await supabase
      .from("task_title_dictionary")
      .select("id, title")
      .order("title");

    if (data) {
      setTaskTitles(data);
    }
  };

  const fetchMeetingTypes = async () => {
    const { data } = await supabase
      .from("meeting_type_dictionary")
      .select("id, type_name")
      .order("type_name");

    if (data) {
      setMeetingTypes(data);
    }
  };

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");

    if (data) {
      setEmployees(data);
    }
  };

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("id, name")
      .order("name");

    if (data) {
      setClients(data);
    }
  };

  const fetchContracts = async () => {
    const { data } = await supabase
      .from("contracts")
      .select("id, contract_number, client_id")
      .order("contract_number");

    if (data) {
      setContracts(data);
    }
  };

  const fetchOffers = async () => {
    const { data } = await supabase
      .from("offers")
      .select("id, offer_number, client_id")
      .order("offer_number");

    if (data) {
      setOffers(data);
    }
  };

  const fetchRobots = async () => {
    const { data } = await supabase
      .from("robots")
      .select("id, type, model, serial_number, client_id")
      .order("serial_number");

    if (data) {
      setRobots(data);
    }
  };

  const fetchTaskData = async () => {
    if (!taskId) return;
    
    setIsLoading(true);
    try {
      // Fetch task data
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .maybeSingle();

      if (taskError) throw taskError;

      if (!task) {
        toast({
          title: "Error",
          description: "Task not found",
          variant: "destructive",
        });
        return;
      }

      // Fetch task robots
      const { data: taskRobots, error: robotsError } = await supabase
        .from("task_robots")
        .select("robot_id")
        .eq("task_id", taskId);

      if (robotsError) throw robotsError;

      // Set form values
      form.reset({
        title: task.title,
        description: task.description || "",
        due_date: task.due_date ? new Date(task.due_date) : undefined,
        status: task.status as TaskFormValues["status"],
        assigned_to: task.assigned_to || undefined,
        client_id: task.client_id || undefined,
        contract_id: task.contract_id || undefined,
        robot_ids: taskRobots?.map(tr => tr.robot_id) || [],
        offer_id: task.offer_id || undefined,
        meeting_type: task.meeting_type || undefined,
        person_to_meet: task.person_to_meet || "",
        meeting_date_time: task.meeting_date_time ? new Date(task.meeting_date_time) : undefined,
        place: task.place || "",
        reminder_date_time: task.reminder_date_time ? new Date(task.reminder_date_time) : undefined,
        notes: task.notes || "",
      });

      // Store created_at for display
      if (task.created_at) {
        setTaskCreatedAt(task.created_at);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load task data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: TaskFormValues) => {
    setIsSubmitting(true);
    try {
      if (taskId) {
        // Update existing task
        const { error: taskError } = await supabase
          .from("tasks")
          .update({
            title: values.title,
            description: values.description || null,
            due_date: values.due_date ? values.due_date.toISOString() : null,
            status: values.status,
            assigned_to: values.assigned_to || null,
            client_id: values.client_id || null,
            contract_id: values.contract_id || null,
            offer_id: values.offer_id || null,
            meeting_type: values.meeting_type || null,
            person_to_meet: values.person_to_meet || null,
            meeting_date_time: values.meeting_date_time ? values.meeting_date_time.toISOString() : null,
            place: values.place || null,
            reminder_date_time: values.reminder_date_time ? values.reminder_date_time.toISOString() : null,
            notes: values.notes || null,
          })
          .eq("id", taskId);

        if (taskError) throw taskError;

        // Delete existing robot relationships
        const { error: deleteError } = await supabase
          .from("task_robots")
          .delete()
          .eq("task_id", taskId);

        if (deleteError) throw deleteError;

        // Insert new robot relationships
        if (values.robot_ids && values.robot_ids.length > 0) {
          const taskRobots = values.robot_ids.map(robotId => ({
            task_id: taskId,
            robot_id: robotId,
          }));

          const { error: robotsError } = await supabase
            .from("task_robots")
            .insert(taskRobots);

          if (robotsError) throw robotsError;
        }

        toast({
          title: "Success",
          description: "Task updated successfully",
        });
      } else {
        // Create new task
        const { data: task, error: taskError } = await supabase
          .from("tasks")
          .insert({
            title: values.title,
            description: values.description || null,
            due_date: values.due_date ? values.due_date.toISOString() : null,
            status: values.status,
            assigned_to: values.assigned_to || null,
            client_id: values.client_id || null,
            contract_id: values.contract_id || null,
            offer_id: values.offer_id || null,
            meeting_type: values.meeting_type || null,
            person_to_meet: values.person_to_meet || null,
            meeting_date_time: values.meeting_date_time ? values.meeting_date_time.toISOString() : null,
            place: values.place || null,
            reminder_date_time: values.reminder_date_time ? values.reminder_date_time.toISOString() : null,
            notes: values.notes || null,
          })
          .select()
          .single();

        if (taskError) throw taskError;

        // Insert task-robot relationships if robots were selected
        if (task && values.robot_ids && values.robot_ids.length > 0) {
          const taskRobots = values.robot_ids.map(robotId => ({
            task_id: task.id,
            robot_id: robotId,
          }));

          const { error: robotsError } = await supabase
            .from("task_robots")
            .insert(taskRobots);

          if (robotsError) throw robotsError;
        }

        toast({
          title: "Success",
          description: "Task created successfully",
        });
      }

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: taskId ? "Failed to update task" : "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canAssignEmployee = userRole === "admin" || userRole === "manager";
  const isViewMode = mode === "view" && !isEditing;

  // Field visibility logic based on task type
  const showClientField = ["Client meeting", "Contract review", "Demo presentation", "Follow up call", "Price negotiation", "Offer (proposal) preparation", "Site Visit", "Technical support"].includes(selectedTaskTitle);
  const showOfferField = ["Client meeting", "Demo presentation", "Follow up call", "Price negotiation", "Site Visit"].includes(selectedTaskTitle);
  const showMeetingTypeField = ["Client meeting", "Site Visit"].includes(selectedTaskTitle);
  const showPersonToMeetField = ["Client meeting", "Demo presentation", "Follow up call", "Price negotiation", "Offer (proposal) preparation", "Site Visit"].includes(selectedTaskTitle);
  const showMeetingDateTimeField = ["Client meeting", "Site Visit"].includes(selectedTaskTitle);
  const showPlaceField = ["Client meeting", "Site Visit"].includes(selectedTaskTitle);
  const showReminderField = ["Client meeting", "Site Visit"].includes(selectedTaskTitle);
  const showContractField = ["Contract review", "Technical support"].includes(selectedTaskTitle);
  const showRobotsField = ["Demo presentation"].includes(selectedTaskTitle);
  const showDueDateField = ["Contract review", "Documentation update", "Follow up call", "Price negotiation", "Offer (proposal) preparation", "Training session"].includes(selectedTaskTitle);
  const showNotesField = true; // All task types can have notes
  const clientIsOptional = selectedTaskTitle === "Documentation update";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>
                {isViewMode ? "View Task" : taskId ? "Edit Task" : "Create New Task"}
              </DialogTitle>
              <DialogDescription>
                {isViewMode 
                  ? "Task details and information" 
                  : taskId 
                    ? "Update task details and assignments"
                    : "Add a new task with details and assignments"
                }
              </DialogDescription>
            </div>
            {taskCreatedAt && (
              <div className="text-right text-sm text-muted-foreground">
                <div className="font-medium">Created</div>
                <div>{new Date(taskCreatedAt).toLocaleDateString()}</div>
                <div className="text-xs">{new Date(taskCreatedAt).toLocaleTimeString()}</div>
              </div>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : (

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task</FormLabel>
                  {isViewMode ? (
                    <div className="text-sm py-2 px-3 border rounded-md bg-muted">
                      {field.value || "-"}
                    </div>
                  ) : (
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a task" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {taskTitles.map((task) => (
                          <SelectItem key={task.id} value={task.title}>
                            {task.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
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
                  {isViewMode ? (
                    <div className="text-sm py-2 px-3 border rounded-md bg-muted min-h-[60px] whitespace-pre-wrap">
                      {field.value || "-"}
                    </div>
                  ) : (
                    <FormControl>
                      <Textarea {...field} placeholder="Task description (optional)" rows={2} />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {(isViewMode ? (showClientField && form.watch("client_id")) : showClientField) && (
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer {clientIsOptional && "(optional)"}</FormLabel>
                    {isViewMode ? (
                      <div className="text-sm py-2 px-3 border rounded-md bg-muted">
                        {clients.find(c => c.id === field.value)?.name || "-"}
                      </div>
                    ) : (
                      <FormControl>
                        <ClientCombobox
                          clients={clients}
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue("contract_id", undefined);
                            form.setValue("offer_id", undefined);
                            form.setValue("robot_ids", []);
                          }}
                          placeholder={`Select customer ${clientIsOptional ? "(optional)" : ""}`}
                        />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(isViewMode ? (showOfferField && form.watch("offer_id")) : (selectedClientId && showOfferField && filteredOffers.length > 0)) && (
              <FormField
                control={form.control}
                name="offer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offer</FormLabel>
                    {isViewMode ? (
                      <div className="text-sm py-2 px-3 border rounded-md bg-muted">
                        {offers.find(o => o.id === field.value)?.offer_number || "-"}
                      </div>
                    ) : (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select offer (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredOffers.map((offer) => (
                            <SelectItem key={offer.id} value={offer.id}>
                              {offer.offer_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(isViewMode ? (showContractField && form.watch("contract_id")) : (selectedClientId && showContractField && filteredContracts.length > 0)) && (
              <FormField
                control={form.control}
                name="contract_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract</FormLabel>
                    {isViewMode ? (
                      <div className="text-sm py-2 px-3 border rounded-md bg-muted">
                        {contracts.find(c => c.id === field.value)?.contract_number || "-"}
                      </div>
                    ) : (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select contract" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredContracts.map((contract) => (
                            <SelectItem key={contract.id} value={contract.id}>
                              {contract.contract_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(isViewMode ? (showMeetingTypeField && form.watch("meeting_type")) : showMeetingTypeField) && (
              <FormField
                control={form.control}
                name="meeting_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Type</FormLabel>
                    {isViewMode ? (
                      <div className="text-sm py-2 px-3 border rounded-md bg-muted">
                        {field.value || "-"}
                      </div>
                    ) : (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select meeting type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {meetingTypes.map((type) => (
                            <SelectItem key={type.id} value={type.type_name}>
                              {type.type_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(isViewMode ? (showPersonToMeetField && form.watch("person_to_meet")) : showPersonToMeetField) && (
              <FormField
                control={form.control}
                name="person_to_meet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Person to Meet</FormLabel>
                    {isViewMode ? (
                      <div className="text-sm py-2 px-3 border rounded-md bg-muted">
                        {field.value || "-"}
                      </div>
                    ) : (
                      <FormControl>
                        <Input {...field} placeholder="Enter person name" />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(isViewMode ? (showMeetingDateTimeField && form.watch("meeting_date_time")) : showMeetingDateTimeField) && (
              <FormField
                control={form.control}
                name="meeting_date_time"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Meeting Date & Time</FormLabel>
                    {isViewMode ? (
                      <div className="text-sm py-2 px-3 border rounded-md bg-muted">
                        {field.value ? format(field.value, "PPP HH:mm") : "-"}
                      </div>
                    ) : (
                      <>
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
                                {field.value ? format(field.value, "PPP HH:mm") : <span>Pick a date and time</span>}
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
                            />
                            <div className="p-3 border-t">
                              <Input
                                type="time"
                                value={field.value ? format(field.value, "HH:mm") : ""}
                                onChange={(e) => {
                                  const [hours, minutes] = e.target.value.split(":");
                                  const newDate = field.value ? new Date(field.value) : new Date();
                                  newDate.setHours(parseInt(hours), parseInt(minutes));
                                  field.onChange(newDate);
                                }}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(isViewMode ? (showPlaceField && form.watch("place")) : showPlaceField) && (
              <FormField
                control={form.control}
                name="place"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Place</FormLabel>
                    {isViewMode ? (
                      <div className="text-sm py-2 px-3 border rounded-md bg-muted">
                        {field.value || "-"}
                      </div>
                    ) : (
                      <FormControl>
                        <Input {...field} placeholder="Enter location" />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(isViewMode ? (showReminderField && form.watch("reminder_date_time")) : showReminderField) && (
              <FormField
                control={form.control}
                name="reminder_date_time"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Reminder Date & Time</FormLabel>
                    {isViewMode ? (
                      <div className="text-sm py-2 px-3 border rounded-md bg-muted">
                        {field.value ? format(field.value, "PPP HH:mm") : "-"}
                      </div>
                    ) : (
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
                              {field.value ? format(field.value, "PPP HH:mm") : <span>Auto-set 3 hours before meeting</span>}
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
                          />
                          <div className="p-3 border-t">
                            <Input
                              type="time"
                              value={field.value ? format(field.value, "HH:mm") : ""}
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(":");
                                const newDate = field.value ? new Date(field.value) : new Date();
                                newDate.setHours(parseInt(hours), parseInt(minutes));
                                field.onChange(newDate);
                              }}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(isViewMode ? (showRobotsField && (form.watch("robot_ids")?.length ?? 0) > 0) : (selectedClientId && showRobotsField && filteredRobots.length > 0)) && (
              <FormField
                control={form.control}
                name="robot_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Robots</FormLabel>
                    {isViewMode ? (
                      <div className="text-sm py-2 px-3 border rounded-md bg-muted">
                        {field.value && field.value.length > 0 
                          ? robots.filter(r => field.value?.includes(r.id)).map(r => 
                              `${r.type} - ${r.model} (${r.serial_number})`
                            ).join(", ")
                          : "-"
                        }
                      </div>
                    ) : (
                      <div className="space-y-2 border rounded-md p-3 max-h-[200px] overflow-y-auto">
                        {filteredRobots.map((robot) => (
                          <div key={robot.id} className="flex items-center space-x-2">
                            <Checkbox
                              checked={field.value?.includes(robot.id)}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange([...current, robot.id]);
                                } else {
                                  field.onChange(current.filter(id => id !== robot.id));
                                }
                              }}
                            />
                            <label className="text-sm flex-1 cursor-pointer">
                              <span className="font-medium">{robot.type}</span>
                              {" - "}
                              <span>{robot.model}</span>
                              {" ("}
                              <span className="text-muted-foreground">{robot.serial_number}</span>
                              {")"}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(isViewMode ? (showDueDateField && form.watch("due_date")) : showDueDateField) && (
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    {isViewMode ? (
                      <div className="text-sm py-2 px-3 border rounded-md bg-muted">
                        {field.value ? format(field.value, "PPP") : "-"}
                      </div>
                    ) : (
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
                              {field.value ? format(field.value, "PPP") : <span>Pick a due date</span>}
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
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showNotesField && (
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    {isViewMode ? (
                      <div className="text-sm py-2 px-3 border rounded-md bg-muted min-h-[80px] whitespace-pre-wrap">
                        {field.value || "-"}
                      </div>
                    ) : (
                      <FormControl>
                        <Textarea {...field} placeholder="Add notes..." rows={3} />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  {isViewMode ? (
                    <div className="text-sm py-2 px-3 border rounded-md bg-muted capitalize">
                      {field.value?.replace("_", " ") || "-"}
                    </div>
                  ) : (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {(canAssignEmployee || isViewMode) && (
              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    {isViewMode ? (
                      <div className="text-sm py-2 px-3 border rounded-md bg-muted">
                        {employees.find(e => e.id === field.value)?.full_name || "-"}
                      </div>
                    ) : (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-3 pt-4">
              {isViewMode ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className="flex-1"
                  >
                    Edit Task
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (taskId && mode === "view") {
                        setIsEditing(false);
                      } else {
                        onOpenChange(false);
                      }
                    }}
                    className="flex-1"
                  >
                    {taskId && mode === "view" ? "Cancel" : "Cancel"}
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting 
                      ? (taskId ? "Updating..." : "Creating...") 
                      : (taskId ? "Update Task" : "Create Task")
                    }
                  </Button>
                </>
              )}
            </div>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
