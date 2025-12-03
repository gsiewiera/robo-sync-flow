import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Package, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { AddressMap } from "@/components/clients/AddressMap";

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

const RobotDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [robot, setRobot] = useState<Robot | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [clientAddresses, setClientAddresses] = useState<ClientAddress[]>([]);
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);

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
        } else if (clientData?.address) {
          // Fall back to client's direct address if no separate addresses
          setClientAddresses([{
            id: 'client-address',
            address: clientData.address,
            city: clientData.city,
            postal_code: clientData.postal_code,
            country: clientData.country,
            label: 'Primary Address',
            is_primary: true,
          }]);
        }
      }
    }

    const { data: ticketsData } = await supabase
      .from("service_tickets")
      .select("*")
      .eq("robot_id", id)
      .order("created_at", { ascending: false });

    if (ticketsData) {
      setTickets(ticketsData);
    }
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/robots")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{robot.serial_number}</h1>
            <p className="text-muted-foreground">Robot Details</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
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

        {/* Location Section with Map */}
        {client && clientAddresses.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Location</h2>
            </div>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{clientAddresses[0]?.address}</p>
                <p>{clientAddresses[0]?.postal_code} {clientAddresses[0]?.city}</p>
                <p>{clientAddresses[0]?.country}</p>
              </div>
              <AddressMap addresses={clientAddresses} />
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Service History</h2>
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
      </div>
    </Layout>
  );
};

export default RobotDetail;
