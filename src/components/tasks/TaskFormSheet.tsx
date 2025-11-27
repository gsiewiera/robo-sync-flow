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
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const TaskFormSheet = ({ open, onOpenChange, onSuccess }: TaskFormSheetProps) => {
  const [taskTitles, setTaskTitles] = useState<TaskTitleDictionary[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [filteredRobots, setFilteredRobots] = useState<Robot[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    },
  });

  useEffect(() => {
    fetchTaskTitles();
    fetchEmployees();
    fetchClients();
    fetchContracts();
    fetchRobots();
    checkUserRole();
  }, []);

  // Filter contracts and robots when client changes
  const selectedClientId = form.watch("client_id");
  useEffect(() => {
    if (selectedClientId) {
      setFilteredContracts(contracts.filter(c => c.client_id === selectedClientId));
      setFilteredRobots(robots.filter(r => r.client_id === selectedClientId));
    } else {
      setFilteredContracts([]);
      setFilteredRobots([]);
    }
  }, [selectedClientId, contracts, robots]);

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

  const fetchRobots = async () => {
    const { data } = await supabase
      .from("robots")
      .select("id, type, model, serial_number, client_id")
      .order("serial_number");

    if (data) {
      setRobots(data);
    }
  };

  const onSubmit = async (values: TaskFormValues) => {
    setIsSubmitting(true);
    try {
      // Insert task
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

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canAssignEmployee = userRole === "admin" || userRole === "manager";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task with details and assignments
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset contract and robots when client changes
                      form.setValue("contract_id", undefined);
                      form.setValue("robot_ids", []);
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedClientId && (
              <FormField
                control={form.control}
                name="contract_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select contract (optional)" />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter task description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedClientId && filteredRobots.length > 0 && (
              <FormField
                control={form.control}
                name="robot_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Robots</FormLabel>
                    <div className="space-y-2 border rounded-md p-3">
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {canAssignEmployee && (
              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
