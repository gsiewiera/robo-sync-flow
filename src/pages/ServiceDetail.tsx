import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wrench, User, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";

interface ServiceTicket {
  id: string;
  ticket_number: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  resolved_at: string | null;
  client_id: string;
  robot_id: string;
  assigned_to: string | null;
}

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
  full_name: string;
}

const statusColors: Record<string, string> = {
  open: "bg-warning text-warning-foreground",
  in_progress: "bg-primary text-primary-foreground",
  resolved: "bg-success text-success-foreground",
  closed: "bg-muted text-muted-foreground",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary text-primary-foreground",
  high: "bg-destructive text-destructive-foreground",
};

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<ServiceTicket | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [robot, setRobot] = useState<Robot | null>(null);
  const [assignee, setAssignee] = useState<Profile | null>(null);

  useEffect(() => {
    if (id) {
      fetchTicketData();
    }
  }, [id]);

  const fetchTicketData = async () => {
    const { data: ticketData } = await supabase
      .from("service_tickets")
      .select("*")
      .eq("id", id)
      .single();

    if (ticketData) {
      setTicket(ticketData);

      const { data: clientData } = await supabase
        .from("clients")
        .select("id, name")
        .eq("id", ticketData.client_id)
        .single();

      if (clientData) {
        setClient(clientData);
      }

      const { data: robotData } = await supabase
        .from("robots")
        .select("id, serial_number, model")
        .eq("id", ticketData.robot_id)
        .single();

      if (robotData) {
        setRobot(robotData);
      }

      if (ticketData.assigned_to) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", ticketData.assigned_to)
          .single();

        if (profileData) {
          setAssignee(profileData);
        }
      }
    }
  };

  if (!ticket) {
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
          <Button variant="ghost" size="icon" onClick={() => navigate("/service")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{ticket.ticket_number}</h1>
            <p className="text-muted-foreground">Service Ticket Details</p>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning/10 rounded-lg">
                <Wrench className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{ticket.title}</h2>
                <div className="flex gap-2 mt-2">
                  <Badge className={statusColors[ticket.status]}>
                    {ticket.status.replace("_", " ")}
                  </Badge>
                  <Badge className={priorityColors[ticket.priority]}>
                    {ticket.priority} priority
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {client && (
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-lg"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    {client.name}
                  </Button>
                </div>
              )}
              {robot && (
                <div>
                  <p className="text-sm text-muted-foreground">Robot</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium"
                    onClick={() => navigate(`/robots/${robot.id}`)}
                  >
                    {robot.serial_number} - {robot.model}
                  </Button>
                </div>
              )}
              {assignee && (
                <div className="flex gap-2">
                  <User className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned To</p>
                    <p className="font-medium">{assignee.full_name}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {ticket.resolved_at && (
                <div className="flex gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Resolved</p>
                    <p className="font-medium">
                      {new Date(ticket.resolved_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {ticket.description && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-2">Description</p>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default ServiceDetail;
