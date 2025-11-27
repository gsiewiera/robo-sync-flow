import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, MapPin, FileText, ShoppingCart, Bot, Globe, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";

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
  status: string;
  total_price: number | null;
  created_at: string;
}

interface Robot {
  id: string;
  serial_number: string;
  model: string;
  status: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_signature: "bg-warning text-warning-foreground",
  active: "bg-success text-success-foreground",
  sent: "bg-primary text-primary-foreground",
  accepted: "bg-success text-success-foreground",
  rejected: "bg-destructive text-destructive-foreground",
  in_warehouse: "bg-muted text-muted-foreground",
  delivered: "bg-success text-success-foreground",
};

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
              <h1 className="text-3xl font-bold text-foreground">{client.name}</h1>
              <p className="text-muted-foreground">Client Details</p>
            </div>
          </div>
          <Button onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Client
          </Button>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Company Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
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
                      {contract.monthly_payment.toFixed(2)} PLN/mo
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
                      <Badge className={statusColors[offer.status]}>{offer.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created: {new Date(offer.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {offer.total_price && (
                    <p className="text-lg font-bold text-accent">
                      {offer.total_price.toFixed(2)} PLN
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
