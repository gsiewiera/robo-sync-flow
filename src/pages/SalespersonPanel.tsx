import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  FileText, 
  ShoppingCart, 
  CheckSquare, 
  TrendingUp,
  UserPlus,
  Eye,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

interface KPIData {
  totalSales: number;
  totalTasks: number;
  completedTasks: number;
  totalLeads: number;
  totalOffers: number;
  signedContracts: number;
  assignedClients: number;
  totalRevenue: number;
}

interface Task {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  clients: { name: string } | null;
}

interface Lead {
  id: string;
  offer_number: string;
  lead_status: string;
  created_at: string;
  clients: { name: string } | null;
}

interface Offer {
  id: string;
  offer_number: string;
  stage: string;
  total_price: number | null;
  currency: string | null;
  clients: { name: string } | null;
}

interface Contract {
  id: string;
  contract_number: string;
  status: string;
  total_purchase_value: number | null;
  clients: { name: string } | null;
}

interface Client {
  id: string;
  name: string;
  city: string | null;
  status: string | null;
  created_at: string | null;
}

const SalespersonPanel = () => {
  const [salespeople, setSalespeople] = useState<Profile[]>([]);
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>("");
  const [kpiData, setKpiData] = useState<KPIData>({
    totalSales: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalLeads: 0,
    totalOffers: 0,
    signedContracts: 0,
    assignedClients: 0,
    totalRevenue: 0,
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAndFetchSalespeople();
  }, []);

  useEffect(() => {
    if (selectedSalesperson) {
      fetchSalespersonData(selectedSalesperson);
    }
  }, [selectedSalesperson]);

  const checkAdminAndFetchSalespeople = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const adminCheck = roles?.some(r => r.role === "admin") || false;
      setIsAdmin(adminCheck);

      if (!adminCheck) {
        setLoading(false);
        return;
      }

      // Fetch all salespeople
      const { data: salespeopleRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "salesperson");

      if (salespeopleRoles && salespeopleRoles.length > 0) {
        const userIds = salespeopleRoles.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds)
          .order("full_name");

        if (profiles) {
          setSalespeople(profiles);
          if (profiles.length > 0) {
            setSelectedSalesperson(profiles[0].id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalespersonData = async (salespersonId: string) => {
    setLoading(true);
    try {
      // Fetch tasks
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("id, title, status, due_date, clients(name)")
        .eq("assigned_to", salespersonId)
        .order("due_date", { ascending: true });

      // Fetch leads (offers with stage = 'leads')
      const { data: leadsData } = await supabase
        .from("offers")
        .select("id, offer_number, lead_status, created_at, clients(name)")
        .eq("assigned_salesperson_id", salespersonId)
        .eq("stage", "leads")
        .order("created_at", { ascending: false });

      // Fetch offers (non-lead stages)
      const { data: offersData } = await supabase
        .from("offers")
        .select("id, offer_number, stage, total_price, currency, clients(name)")
        .eq("assigned_salesperson_id", salespersonId)
        .neq("stage", "leads")
        .order("created_at", { ascending: false });

      // Fetch contracts
      const { data: contractsData } = await supabase
        .from("contracts")
        .select("id, contract_number, status, total_purchase_value, clients(name)")
        .eq("created_by", salespersonId)
        .order("created_at", { ascending: false });

      // Fetch assigned clients
      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, name, city, status, created_at")
        .eq("assigned_salesperson_id", salespersonId)
        .order("name");

      setTasks(tasksData || []);
      setLeads(leadsData || []);
      setOffers(offersData || []);
      setContracts(contractsData || []);
      setClients(clientsData || []);

      // Calculate KPIs
      const completedTasks = tasksData?.filter(t => t.status === "completed").length || 0;
      const signedContracts = contractsData?.filter(c => c.status === "active").length || 0;
      const totalRevenue = contractsData?.reduce((sum, c) => sum + (c.total_purchase_value || 0), 0) || 0;
      const offerRevenue = offersData?.filter(o => o.stage === "won").reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;

      setKpiData({
        totalSales: offerRevenue,
        totalTasks: tasksData?.length || 0,
        completedTasks,
        totalLeads: leadsData?.length || 0,
        totalOffers: offersData?.length || 0,
        signedContracts,
        assignedClients: clientsData?.length || 0,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching salesperson data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-warning text-warning-foreground",
    in_progress: "bg-primary text-primary-foreground",
    completed: "bg-success text-success-foreground",
    overdue: "bg-destructive text-destructive-foreground",
    active: "bg-success text-success-foreground",
    draft: "bg-muted text-muted-foreground",
    new: "bg-primary text-primary-foreground",
    contacted: "bg-warning text-warning-foreground",
    qualified: "bg-success text-success-foreground",
    lost: "bg-destructive text-destructive-foreground",
  };

  if (!isAdmin && !loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Access denied. Admin only.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Salesperson Panel</h1>
            <p className="text-muted-foreground">Monitor salesperson performance and activities</p>
          </div>
          <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select salesperson" />
            </SelectTrigger>
            <SelectContent>
              {salespeople.map((sp) => (
                <SelectItem key={sp.id} value={sp.id}>
                  {sp.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(kpiData.totalSales)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpiData.completedTasks}/{kpiData.totalTasks}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpiData.totalLeads}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Offers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpiData.totalOffers}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Contracts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpiData.signedContracts}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(kpiData.totalRevenue)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpiData.assignedClients}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs with detailed data */}
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
            <TabsTrigger value="offers">Offers ({offers.length})</TabsTrigger>
            <TabsTrigger value="contracts">Contracts ({contracts.length})</TabsTrigger>
            <TabsTrigger value="clients">Clients ({clients.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No tasks found
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>{task.clients?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[task.status] || "bg-muted"}>
                            {task.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.due_date ? format(new Date(task.due_date), "dd/MM/yyyy") : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="leads">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead Number</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No leads found
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.offer_number}</TableCell>
                        <TableCell>{lead.clients?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[lead.lead_status || "new"] || "bg-muted"}>
                            {lead.lead_status || "new"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(lead.created_at), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/offers/${lead.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="offers">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Offer Number</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No offers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    offers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell className="font-medium">{offer.offer_number}</TableCell>
                        <TableCell>{offer.clients?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{offer.stage}</Badge>
                        </TableCell>
                        <TableCell>
                          {offer.total_price ? formatCurrency(offer.total_price) : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/offers/${offer.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="contracts">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract Number</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No contracts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    contracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">{contract.contract_number}</TableCell>
                        <TableCell>{contract.clients?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[contract.status] || "bg-muted"}>
                            {contract.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {contract.total_purchase_value ? formatCurrency(contract.total_purchase_value) : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/contracts/${contract.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No clients assigned
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.city || "-"}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[client.status || "active"] || "bg-muted"}>
                            {client.status || "active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {client.created_at ? format(new Date(client.created_at), "dd/MM/yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/clients/${client.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SalespersonPanel;
