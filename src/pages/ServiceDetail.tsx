import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wrench, User, Calendar, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

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
  id: string;
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

const statusOptions = ["open", "in_progress", "resolved", "closed"];
const priorityOptions = ["low", "medium", "high"];

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<ServiceTicket | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [robot, setRobot] = useState<Robot | null>(null);
  const [assignee, setAssignee] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editAssignee, setEditAssignee] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchTicketData();
      fetchProfiles();
    }
  }, [id]);

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");
    if (data) setProfiles(data);
  };

  const fetchTicketData = async () => {
    const { data: ticketData } = await supabase
      .from("service_tickets")
      .select("*")
      .eq("id", id)
      .single();

    if (ticketData) {
      setTicket(ticketData);
      setEditStatus(ticketData.status);
      setEditPriority(ticketData.priority);
      setEditAssignee(ticketData.assigned_to);

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
          .select("id, full_name")
          .eq("id", ticketData.assigned_to)
          .single();

        if (profileData) {
          setAssignee(profileData);
        }
      }
    }
  };

  const handleSave = async () => {
    if (!ticket) return;

    const updates: Record<string, unknown> = {
      status: editStatus,
      priority: editPriority,
      assigned_to: editAssignee || null,
    };

    if (editStatus === "resolved" && ticket.status !== "resolved") {
      updates.resolved_at = new Date().toISOString();
    } else if (editStatus !== "resolved" && editStatus !== "closed") {
      updates.resolved_at = null;
    }

    const { error } = await supabase
      .from("service_tickets")
      .update(updates)
      .eq("id", ticket.id);

    if (error) {
      toast.error("Failed to update ticket");
    } else {
      toast.success("Ticket updated successfully");
      setIsEditing(false);
      fetchTicketData();
    }
  };

  const handleCancel = () => {
    if (ticket) {
      setEditStatus(ticket.status);
      setEditPriority(ticket.priority);
      setEditAssignee(ticket.assigned_to);
    }
    setIsEditing(false);
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/service")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{ticket.ticket_number}</h1>
              <p className="text-muted-foreground">Service Ticket Details</p>
            </div>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning/10 rounded-lg">
                <Wrench className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{ticket.title}</h2>
                {isEditing ? (
                  <div className="flex gap-2 mt-2">
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={editPriority} onValueChange={setEditPriority}>
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority} priority
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <Badge className={statusColors[ticket.status]}>
                      {ticket.status.replace("_", " ")}
                    </Badge>
                    <Badge className={priorityColors[ticket.priority]}>
                      {ticket.priority} priority
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            {isEditing && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  Save
                </Button>
              </div>
            )}
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
              <div className="flex gap-2">
                <User className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Assigned To</p>
                  {isEditing ? (
                    <Select value={editAssignee || "unassigned"} onValueChange={(val) => setEditAssignee(val === "unassigned" ? null : val)}>
                      <SelectTrigger className="w-[200px] h-8 mt-1">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{assignee?.full_name || "Unassigned"}</p>
                  )}
                </div>
              </div>
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
