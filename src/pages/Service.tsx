import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wrench } from "lucide-react";

interface ServiceTicket {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  clients: { name: string } | null;
  robots: { serial_number: string } | null;
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

const Service = () => {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from("service_tickets")
      .select("*, clients(name), robots(serial_number)")
      .order("created_at", { ascending: false });

    if (data && !error) {
      setTickets(data);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Service Tickets</h1>
          <p className="text-muted-foreground">Manage service requests and interventions</p>
        </div>

        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="p-3 bg-warning/10 rounded-lg">
                    <Wrench className="w-6 h-6 text-warning" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{ticket.ticket_number}</h3>
                      <Badge className={statusColors[ticket.status]}>
                        {ticket.status.replace("_", " ")}
                      </Badge>
                      <Badge className={priorityColors[ticket.priority]}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <p className="font-medium">{ticket.title}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {ticket.clients && (
                        <span>Client: {ticket.clients.name}</span>
                      )}
                      {ticket.robots && (
                        <span>Robot: {ticket.robots.serial_number}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {tickets.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No service tickets found</p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Service;
