import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Client {
  id: string;
  name: string;
  nip: string | null;
  city: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
}

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("name");

    if (data && !error) {
      setClients(data);
    }
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.nip?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground">Manage your client relationships</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>

        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search clients by name or NIP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        <div className="grid gap-4">
          {filteredClients.map((client) => (
            <Card
              key={client.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">{client.name}</h3>
                  {client.nip && (
                    <p className="text-sm text-muted-foreground">NIP: {client.nip}</p>
                  )}
                  {client.city && (
                    <p className="text-sm text-muted-foreground">{client.city}</p>
                  )}
                </div>
                <div className="text-right space-y-1">
                  {client.primary_contact_name && (
                    <p className="text-sm font-medium">{client.primary_contact_name}</p>
                  )}
                  {client.primary_contact_email && (
                    <p className="text-sm text-muted-foreground">{client.primary_contact_email}</p>
                  )}
                  {client.primary_contact_phone && (
                    <p className="text-sm text-muted-foreground">{client.primary_contact_phone}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No clients found</p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Clients;
