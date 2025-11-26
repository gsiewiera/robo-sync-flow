import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText } from "lucide-react";

interface Contract {
  id: string;
  contract_number: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  monthly_payment: number | null;
  clients: { name: string } | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_signature: "bg-warning text-warning-foreground",
  active: "bg-success text-success-foreground",
  expired: "bg-destructive text-destructive-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

const Contracts = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    const { data, error } = await supabase
      .from("contracts")
      .select("*, clients(name)")
      .order("created_at", { ascending: false });

    if (data && !error) {
      setContracts(data);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contracts</h1>
          <p className="text-muted-foreground">Manage client contracts and agreements</p>
        </div>

        <div className="grid gap-4">
          {contracts.map((contract) => (
            <Card key={contract.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{contract.contract_number}</h3>
                      <Badge className={statusColors[contract.status]}>
                        {contract.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {contract.clients && (
                      <p className="text-sm text-muted-foreground">
                        Client: {contract.clients.name}
                      </p>
                    )}
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {contract.start_date && (
                        <span>Start: {new Date(contract.start_date).toLocaleDateString()}</span>
                      )}
                      {contract.end_date && (
                        <span>End: {new Date(contract.end_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                {contract.monthly_payment && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {contract.monthly_payment.toFixed(2)} PLN
                    </p>
                    <p className="text-sm text-muted-foreground">per month</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {contracts.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No contracts found</p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Contracts;
