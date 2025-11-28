import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, Shield, User, Building, FileText, CheckSquare, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  created_at: string;
}

interface UserRole {
  role: string;
}

interface Client {
  id: string;
  name: string;
  city: string | null;
  status: string | null;
  created_at: string;
}

interface Offer {
  id: string;
  offer_number: string;
  stage: string;
  total_price: number | null;
  currency: string | null;
  created_at: string;
  clients: { name: string } | null;
}

interface Task {
  id: string;
  title: string;
  status: string | null;
  due_date: string | null;
  created_at: string;
  clients: { name: string } | null;
}

interface Contract {
  id: string;
  contract_number: string;
  status: string | null;
  total_purchase_value: number | null;
  created_at: string;
  clients: { name: string } | null;
}

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    if (id) {
      fetchUserData();
    }
  }, [id]);

  const fetchUserData = async () => {
    try {
      // Check admin access
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!adminRole) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/");
        return;
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch user roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", id);

      if (rolesData) {
        setRoles(rolesData.map(r => r.role));
      }

      // Fetch assigned clients
      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, name, city, status, created_at")
        .eq("assigned_salesperson_id", id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (clientsData) setClients(clientsData);

      // Fetch created offers
      const { data: offersData } = await supabase
        .from("offers")
        .select(`
          id,
          offer_number,
          stage,
          total_price,
          currency,
          created_at,
          clients(name)
        `)
        .eq("created_by", id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (offersData) setOffers(offersData as any);

      // Fetch assigned tasks
      const { data: tasksData } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          status,
          due_date,
          created_at,
          clients(name)
        `)
        .eq("assigned_to", id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (tasksData) setTasks(tasksData as any);

      // Fetch created contracts
      const { data: contractsData } = await supabase
        .from("contracts")
        .select(`
          id,
          contract_number,
          status,
          total_purchase_value,
          created_at,
          clients(name)
        `)
        .eq("created_by", id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (contractsData) setContracts(contractsData as any);

    } catch (error: any) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return "secondary";
    const statusLower = status.toLowerCase();
    if (statusLower.includes("active") || statusLower.includes("completed")) return "default";
    if (statusLower.includes("pending") || statusLower.includes("progress")) return "secondary";
    if (statusLower.includes("overdue")) return "destructive";
    return "secondary";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading user profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">User not found</h2>
          <Button onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => navigate("/admin/users")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Users
      </Button>

      {/* User Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </span>
                  {profile.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {profile.phone}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Roles
              </h3>
              <div className="flex gap-2 flex-wrap">
                {roles.length > 0 ? (
                  roles.map((role) => (
                    <Badge key={role} variant="secondary" className="capitalize">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No roles assigned</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Member since {format(new Date(profile.created_at), "MMM dd, yyyy")}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Tabs */}
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">
            Clients ({clients.length})
          </TabsTrigger>
          <TabsTrigger value="offers">
            Offers ({offers.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="contracts">
            Contracts ({contracts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Assigned Clients
              </CardTitle>
              <CardDescription>
                Clients managed by this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clients.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.city || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(client.status)}>
                            {client.status || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(client.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/clients/${client.id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No clients assigned to this user
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Created Offers
              </CardTitle>
              <CardDescription>
                Offers created by this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {offers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Offer Number</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell className="font-medium">{offer.offer_number}</TableCell>
                        <TableCell>{offer.clients?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {offer.stage}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {offer.total_price
                            ? `${offer.total_price.toLocaleString()} ${offer.currency || "PLN"}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(offer.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/offers/${offer.id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No offers created by this user
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Assigned Tasks
              </CardTitle>
              <CardDescription>
                Tasks assigned to this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>{task.clients?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(task.status)}>
                            {task.status || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.due_date
                            ? format(new Date(task.due_date), "MMM dd, yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(task.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/tasks")}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No tasks assigned to this user
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Created Contracts
              </CardTitle>
              <CardDescription>
                Contracts created by this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contracts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract Number</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">{contract.contract_number}</TableCell>
                        <TableCell>{contract.clients?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(contract.status)}>
                            {contract.status || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {contract.total_purchase_value
                            ? `${contract.total_purchase_value.toLocaleString()} PLN`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(contract.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/contracts/${contract.id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No contracts created by this user
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
