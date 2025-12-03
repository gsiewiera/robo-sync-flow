import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Clock, Package, MapPin, Plus, Wrench, ClipboardList, FileText } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { AddressMap } from "@/components/clients/AddressMap";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TicketFormDialog } from "@/components/service/TicketFormDialog";
import { TaskFormSheet } from "@/components/tasks/TaskFormSheet";
import { RobotDocuments } from "@/components/robots/RobotDocuments";

interface Robot {
  id: string;
  serial_number: string;
  model: string;
  type: string;
  status: string;
  working_hours: number;
  purchase_date: string | null;
  warehouse_intake_date: string | null;
  delivery_date: string | null;
  warranty_end_date: string | null;
  client_id: string | null;
}

interface Client {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
}

interface ClientAddress {
  id: string;
  address: string;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  label: string | null;
  is_primary: boolean;
}

interface ServiceTicket {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  profiles?: { full_name: string } | null;
}

const statusColors: Record<string, string> = {
  in_warehouse: "bg-muted text-muted-foreground",
  delivered: "bg-success text-success-foreground",
  in_service: "bg-primary text-primary-foreground",
  maintenance: "bg-warning text-warning-foreground",
};

const ticketStatusColors: Record<string, string> = {
  open: "bg-warning text-warning-foreground",
  in_progress: "bg-primary text-primary-foreground",
  resolved: "bg-success text-success-foreground",
  closed: "bg-muted text-muted-foreground",
};

const taskStatusColors: Record<string, string> = {
  pending: "bg-warning text-warning-foreground",
  in_progress: "bg-primary text-primary-foreground",
  completed: "bg-success text-success-foreground",
  overdue: "bg-destructive text-destructive-foreground",
};

const RobotDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [robot, setRobot] = useState<Robot | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [clientAddresses, setClientAddresses] = useState<ClientAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);

  const selectedAddress = useMemo(() => {
    if (!selectedAddressId) return clientAddresses[0] || null;
    return clientAddresses.find(a => a.id === selectedAddressId) || clientAddresses[0] || null;
  }, [selectedAddressId, clientAddresses]);

  const mapAddresses = useMemo(() => {
    return selectedAddress ? [selectedAddress] : [];
  }, [selectedAddress]);

  useEffect(() => {
    if (id) {
      fetchRobotData();
    }
  }, [id]);

  const fetchRobotData = async () => {
    const { data: robotData } = await supabase
      .from("robots")
      .select("*")
      .eq("id", id)
      .single();

    if (robotData) {
      setRobot(robotData);

      if (robotData.client_id) {
        // Fetch client with address fields
        const { data: clientData } = await supabase
          .from("clients")
          .select("id, name, address, city, postal_code, country")
          .eq("id", robotData.client_id)
          .single();

        if (clientData) {
          setClient(clientData);
        }

        // Fetch client addresses
        const { data: addressesData } = await supabase
          .from("client_addresses")
          .select("id, address, city, postal_code, country, label, is_primary")
          .eq("client_id", robotData.client_id)
          .order("is_primary", { ascending: false });

        if (addressesData && addressesData.length > 0) {
          setClientAddresses(addressesData);
          // Set primary address as default selection
          const primaryAddr = addressesData.find(a => a.is_primary) || addressesData[0];
          setSelectedAddressId(primaryAddr.id);
        } else if (clientData?.address) {
          // Fall back to client's direct address if no separate addresses
          const fallbackAddr = {
            id: 'client-address',
            address: clientData.address,
            city: clientData.city,
            postal_code: clientData.postal_code,
            country: clientData.country,
            label: 'Primary Address',
            is_primary: true,
          };
          setClientAddresses([fallbackAddr]);
          setSelectedAddressId(fallbackAddr.id);
        }
      }
    }

    // Fetch service tickets
    const { data: ticketsData } = await supabase
      .from("service_tickets")
      .select("*")
      .eq("robot_id", id)
      .order("created_at", { ascending: false });

    if (ticketsData) {
      setTickets(ticketsData);
    }

    // Fetch tasks related to this robot
    const { data: taskRobotsData } = await supabase
      .from("task_robots")
      .select("task_id")
      .eq("robot_id", id);

    if (taskRobotsData && taskRobotsData.length > 0) {
      const taskIds = taskRobotsData.map(tr => tr.task_id);
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("id, title, status, priority, due_date, assigned_to, profiles(full_name)")
        .in("id", taskIds)
        .order("created_at", { ascending: false });

      if (tasksData) {
        setTasks(tasksData);
      }
    }
  };

  const handleTicketSuccess = () => {
    setIsTicketDialogOpen(false);
    fetchRobotData();
  };

  const handleTaskSuccess = () => {
    setIsTaskSheetOpen(false);
    fetchRobotData();
  };

  if (!robot) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/robots")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{robot.serial_number}</h1>
              <p className="text-muted-foreground">Robot Details</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsTicketDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Ticket
            </Button>
            <Button variant="outline" onClick={() => setIsTaskSheetOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="service">Service & Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Serial Number</p>
                    <p className="font-medium text-lg">{robot.serial_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Model</p>
                    <p className="font-medium text-lg">{robot.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">{robot.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={statusColors[robot.status]}>
                      {robot.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Working Hours</p>
                      <p className="font-medium text-lg">{robot.working_hours}h</p>
                    </div>
                  </div>
                  {client && (
                    <div>
                      <p className="text-sm text-muted-foreground">Current Client</p>
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium"
                        onClick={() => navigate(`/clients/${client.id}`)}
                      >
                        {client.name}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Timeline</h2>
                <div className="space-y-4">
                  {robot.purchase_date && (
                    <div className="flex gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">Purchase Date</p>
                        <p className="font-medium">
                          {new Date(robot.purchase_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {robot.warehouse_intake_date && (
                    <div className="flex gap-2">
                      <Package className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">Warehouse Intake</p>
                        <p className="font-medium">
                          {new Date(robot.warehouse_intake_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {robot.delivery_date && (
                    <div className="flex gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">Delivery Date</p>
                        <p className="font-medium">
                          {new Date(robot.delivery_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {robot.warranty_end_date && (
                    <div className="flex gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">Warranty End Date</p>
                        <p className="font-medium">
                          {new Date(robot.warranty_end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="location" className="mt-6">
            {client && clientAddresses.length > 0 ? (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">Installation Location</h2>
                  </div>
                  <Select value={selectedAddressId || clientAddresses[0]?.id} onValueChange={setSelectedAddressId}>
                    <SelectTrigger className="w-[250px] bg-background">
                      <SelectValue placeholder="Select address" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {clientAddresses.map((addr) => (
                        <SelectItem key={addr.id} value={addr.id}>
                          {addr.label || addr.address.substring(0, 30)}{addr.is_primary && " (Primary)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  {selectedAddress && (
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{selectedAddress.address}</p>
                      <p>{selectedAddress.postal_code} {selectedAddress.city}</p>
                      <p>{selectedAddress.country}</p>
                    </div>
                  )}
                  <AddressMap addresses={mapAddresses} />
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No location available</p>
                  <p className="text-sm text-muted-foreground mt-1">This robot is not assigned to a client with an address</p>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <RobotDocuments robotId={robot.id} />
          </TabsContent>

          <TabsContent value="service" className="space-y-6 mt-6">
            {/* Service Tickets Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Service Tickets</h2>
                </div>
                <Button size="sm" onClick={() => setIsTicketDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Ticket
                </Button>
              </div>
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/service/${ticket.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{ticket.ticket_number}</h3>
                          <Badge className={ticketStatusColors[ticket.status]}>
                            {ticket.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm mt-1">{ticket.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
                {tickets.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No service tickets found</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Tasks Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Tasks</h2>
                </div>
                <Button size="sm" variant="outline" onClick={() => setIsTaskSheetOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              </div>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <Card
                    key={task.id}
                    className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/tasks`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{task.title}</h3>
                          <Badge className={taskStatusColors[task.status]}>
                            {task.status.replace("_", " ")}
                          </Badge>
                        </div>
                        {task.profiles?.full_name && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Assigned to: {task.profiles.full_name}
                          </p>
                        )}
                        {task.due_date && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                {tasks.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No tasks found for this robot</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <TicketFormDialog
        open={isTicketDialogOpen}
        onOpenChange={setIsTicketDialogOpen}
        onSuccess={handleTicketSuccess}
        initialClientId={client?.id}
        initialRobotId={robot.id}
      />

      <TaskFormSheet
        open={isTaskSheetOpen}
        onOpenChange={setIsTaskSheetOpen}
        onSuccess={handleTaskSuccess}
        initialValues={{
          client_id: client?.id,
        }}
      />
    </Layout>
  );
};

export default RobotDetail;
