import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Mail, Phone, MapPin, FileText, ShoppingCart, Bot, 
  Globe, Edit, DollarSign, Receipt, CreditCard, CheckSquare, Calendar
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { formatMoney } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
  nip: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  general_email: string | null;
  general_phone: string | null;
  website_url: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  billing_person_name: string | null;
  billing_person_email: string | null;
  billing_person_phone: string | null;
  balance: number | null;
  status: string | null;
  reseller_id: string | null;
}

interface Contract {
  id: string;
  contract_number: string;
  status: string;
  monthly_payment: number | null;
  start_date: string | null;
}

interface Offer {
  id: string;
  offer_number: string;
  stage: string;
  total_price: number | null;
  created_at: string;
}

interface Robot {
  id: string;
  serial_number: string;
  model: string;
  status: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount_net: number;
  amount_gross: number;
  currency: string;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  status: string;
}

interface Payment {
  id: string;
  payment_number: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  meeting_date_time: string | null;
  meeting_type: string | null;
  assigned_to: string | null;
  profiles?: { full_name: string } | null;
}

const statusColors: Record<string, string> = {
  // Contract/Offer statuses
  draft: "bg-muted text-muted-foreground",
  pending_signature: "bg-warning text-warning-foreground",
  active: "bg-success text-success-foreground",
  sent: "bg-primary text-primary-foreground",
  accepted: "bg-success text-success-foreground",
  rejected: "bg-destructive text-destructive-foreground",
  in_warehouse: "bg-muted text-muted-foreground",
  delivered: "bg-success text-success-foreground",
  // Client statuses
  inactive: "bg-muted text-muted-foreground",
  blocked: "bg-destructive text-destructive-foreground",
  // Invoice statuses
  pending: "bg-warning text-warning-foreground",
  paid: "bg-success text-success-foreground",
  overdue: "bg-destructive text-destructive-foreground",
  cancelled: "bg-muted text-muted-foreground",
  // Funnel stages
  leads: "bg-gray-500",
  qualified: "bg-blue-500",
  proposal_sent: "bg-yellow-500",
  negotiation: "bg-orange-500",
  closed_won: "bg-green-500",
  closed_lost: "bg-red-500",
};

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [clientTags, setClientTags] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reseller, setReseller] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (id) {
      fetchClientData();
    }
  }, [id]);

  const fetchClientData = async () => {
    const { data: clientData } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (clientData) {
      setClient(clientData);

      // Fetch reseller if present
      if (clientData.reseller_id) {
        const { data: resellerData } = await supabase
          .from("resellers")
          .select("id, name")
          .eq("id", clientData.reseller_id)
          .single();

        if (resellerData) {
          setReseller(resellerData);
        }
      }
    }

    // Fetch client tags
    const { data: tagsData } = await supabase
      .from("client_assigned_tags")
      .select("client_tags(*)")
      .eq("client_id", id);

    if (tagsData) {
      setClientTags(tagsData.map(t => t.client_tags).filter(Boolean));
    }

    const { data: contractsData } = await supabase
      .from("contracts")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false });

    if (contractsData) {
      setContracts(contractsData);
    }

    const { data: offersData } = await supabase
      .from("offers")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false });

    if (offersData) {
      setOffers(offersData);
    }

    const { data: robotsData } = await supabase
      .from("robots")
      .select("*")
      .eq("client_id", id);

    if (robotsData) {
      setRobots(robotsData);
    }

    // Fetch invoices
    const { data: invoicesData } = await supabase
      .from("invoices")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false });

    if (invoicesData) {
      setInvoices(invoicesData);
    }

    // Fetch payments
    const { data: paymentsData } = await supabase
      .from("payments")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false });

    if (paymentsData) {
      setPayments(paymentsData);
    }

    // Fetch tasks
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("*, profiles(full_name)")
      .eq("client_id", id)
      .order("created_at", { ascending: false });

    if (tasksData) {
      setTasks(tasksData);
    }
  };

  if (!client) {
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">{client.name}</h1>
                {client.status && (
                  <Badge className={statusColors[client.status]}>
                    {client.status}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">Client Details</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {client.balance !== null && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className={`text-2xl font-bold ${client.balance < 0 ? 'text-destructive' : 'text-success'}`}>
                  {formatMoney(client.balance)} PLN
                </p>
              </div>
            )}
            <Button onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Client
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Company Information</h2>
            {clientTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {clientTags.map((tag: any) => (
                  <Badge
                    key={tag.id}
                    style={{ backgroundColor: tag.color }}
                    className="text-white"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {reseller && (
                <div>
                  <p className="text-sm text-muted-foreground">Reseller Partner</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium"
                    onClick={() => navigate(`/resellers/${reseller.id}`)}
                  >
                    {reseller.name}
                  </Button>
                </div>
              )}
              {client.nip && (
                <div>
                  <p className="text-sm text-muted-foreground">NIP</p>
                  <p className="font-medium">{client.nip}</p>
                </div>
              )}
              {client.address && (
                <div className="flex gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{client.address}</p>
                    <p className="font-medium">
                      {client.postal_code} {client.city}
                    </p>
                    <p className="font-medium">{client.country}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {client.general_email && (
                <div className="flex gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Company Email</p>
                    <p className="font-medium">{client.general_email}</p>
                  </div>
                </div>
              )}
              {client.general_phone && (
                <div className="flex gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Company Phone</p>
                    <p className="font-medium">{client.general_phone}</p>
                  </div>
                </div>
              )}
              {client.website_url && (
                <div className="flex gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <a 
                      href={client.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      {client.website_url}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Contact Person</h3>
            <div className="space-y-4">
              {client.primary_contact_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{client.primary_contact_name}</p>
                </div>
              )}
              {client.primary_contact_email && (
                <div className="flex gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{client.primary_contact_email}</p>
                  </div>
                </div>
              )}
              {client.primary_contact_phone && (
                <div className="flex gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{client.primary_contact_phone}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Billing Contact</h3>
            <div className="space-y-4">
              {client.billing_person_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{client.billing_person_name}</p>
                </div>
              )}
              {client.billing_person_email && (
                <div className="flex gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{client.billing_person_email}</p>
                  </div>
                </div>
              )}
              {client.billing_person_phone && (
                <div className="flex gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{client.billing_person_phone}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <Tabs defaultValue="contracts" className="w-full">
          <TabsList>
            <TabsTrigger value="contracts">
              <FileText className="w-4 h-4 mr-2" />
              Contracts ({contracts.length})
            </TabsTrigger>
            <TabsTrigger value="offers">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Offers ({offers.length})
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <Receipt className="w-4 h-4 mr-2" />
              Invoices & Payments ({invoices.length})
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <CheckSquare className="w-4 h-4 mr-2" />
              Tasks ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="tickets">
              <FileText className="w-4 h-4 mr-2" />
              Support Tickets (0)
            </TabsTrigger>
            <TabsTrigger value="robots">
              <Bot className="w-4 h-4 mr-2" />
              Robots ({robots.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contracts" className="space-y-4">
            {contracts.map((contract) => (
              <Card
                key={contract.id}
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/contracts/${contract.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{contract.contract_number}</h3>
                      <Badge className={statusColors[contract.status]}>
                        {contract.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {contract.start_date && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Start: {new Date(contract.start_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {contract.monthly_payment && (
                    <p className="text-lg font-bold text-primary">
                      {formatMoney(contract.monthly_payment)} PLN/mo
                    </p>
                  )}
                </div>
              </Card>
            ))}
            {contracts.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No contracts found</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="offers" className="space-y-4">
            {offers.map((offer) => (
              <Card
                key={offer.id}
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/offers/${offer.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{offer.offer_number}</h3>
                      <Badge className={statusColors[offer.stage]}>
                        {offer.stage.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created: {new Date(offer.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {offer.total_price && (
                    <p className="text-lg font-bold text-accent">
                      {formatMoney(offer.total_price)} PLN
                    </p>
                  )}
                </div>
              </Card>
            ))}
            {offers.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No offers found</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Invoices Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Invoices
                </h3>
                {invoices.map((invoice) => (
                  <Card key={invoice.id} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">{invoice.invoice_number}</h4>
                          <Badge className={statusColors[invoice.status]}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Due: {new Date(invoice.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {formatMoney(invoice.amount_gross)} {invoice.currency}
                        </p>
                        {invoice.paid_date && (
                          <p className="text-xs text-muted-foreground">
                            Paid: {new Date(invoice.paid_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                {invoices.length === 0 && (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No invoices found</p>
                  </Card>
                )}
              </div>

              {/* Payments Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payments
                </h3>
                {payments.map((payment) => (
                  <Card key={payment.id} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{payment.payment_number}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </p>
                        {payment.payment_method && (
                          <p className="text-xs text-muted-foreground">
                            Method: {payment.payment_method}
                          </p>
                        )}
                      </div>
                      <p className="text-lg font-bold text-success">
                        +{formatMoney(payment.amount)} {payment.currency}
                      </p>
                    </div>
                  </Card>
                ))}
                {payments.length === 0 && (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No payments found</p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            {tasks.map((task) => (
              <Card
                key={task.id}
                className="p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{task.title}</h3>
                      <Badge className={statusColors[task.status] || "bg-muted text-muted-foreground"}>
                        {task.status?.replace("_", " ")}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}
                      {task.meeting_date_time && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Meeting: {new Date(task.meeting_date_time).toLocaleString()}
                        </div>
                      )}
                      {task.profiles?.full_name && (
                        <span>Assigned to: {task.profiles.full_name}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {tasks.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No tasks found for this client</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Support tickets integration coming soon</p>
            </Card>
          </TabsContent>

          <TabsContent value="robots" className="space-y-4">
            {robots.map((robot) => (
              <Card
                key={robot.id}
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/robots/${robot.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{robot.serial_number}</h3>
                      <Badge className={statusColors[robot.status]}>
                        {robot.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{robot.model}</p>
                  </div>
                </div>
              </Card>
            ))}
            {robots.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No robots found</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ClientFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={fetchClientData}
        client={client}
      />
    </Layout>
  );
};

export default ClientDetail;
