import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Calendar, DollarSign, Bot } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { ContractPdfGenerator } from "@/components/contracts/ContractPdfGenerator";
import { formatMoney } from "@/lib/utils";

interface Contract {
  id: string;
  contract_number: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  monthly_payment: number | null;
  payment_model: string | null;
  billing_schedule: string | null;
  terms: string | null;
  client_id: string;
  total_purchase_value?: number | null;
  total_monthly_contracted?: number | null;
  warranty_cost?: number | null;
  implementation_cost?: number | null;
  other_services_cost?: number | null;
  other_services_description?: string | null;
}

interface Client {
  id: string;
  name: string;
  general_email?: string;
  primary_contact_email?: string;
  address?: string;
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
  expired: "bg-destructive text-destructive-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [robots, setRobots] = useState<Robot[]>([]);

  useEffect(() => {
    if (id) {
      fetchContractData();
    }
  }, [id]);

  const fetchContractData = async () => {
    const { data: contractData } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", id)
      .single();

    if (contractData) {
      setContract(contractData);

      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", contractData.client_id)
        .single();

      if (clientData) {
        setClient(clientData);
      }

      const { data: contractRobots } = await supabase
        .from("contract_robots")
        .select("robot_id")
        .eq("contract_id", id);

      if (contractRobots && contractRobots.length > 0) {
        const robotIds = contractRobots.map((cr) => cr.robot_id);
        const { data: robotsData } = await supabase
          .from("robots")
          .select("*")
          .in("id", robotIds);

        if (robotsData) {
          setRobots(robotsData);
        }
      }
    }
  };

  if (!contract) {
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
          <Button variant="ghost" size="icon" onClick={() => navigate("/contracts")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{contract.contract_number}</h1>
            <p className="text-muted-foreground">Contract Details</p>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Contract Information</h2>
                <Badge className={statusColors[contract.status]}>
                  {contract.status.replace("_", " ")}
                </Badge>
              </div>
            </div>
            {contract.monthly_payment && (
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  {formatMoney(contract.monthly_payment)} PLN
                </p>
                <p className="text-sm text-muted-foreground">per month</p>
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
              {contract.payment_model && (
                <div>
                  <p className="text-sm text-muted-foreground">Payment Model</p>
                  <p className="font-medium">{contract.payment_model}</p>
                </div>
              )}
              {contract.billing_schedule && (
                <div>
                  <p className="text-sm text-muted-foreground">Billing Schedule</p>
                  <p className="font-medium">{contract.billing_schedule}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {contract.start_date && (
                <div className="flex gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {new Date(contract.start_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              {contract.end_date && (
                <div className="flex gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">
                      {new Date(contract.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {contract.terms && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-2">Contract Terms</p>
              <p className="text-sm whitespace-pre-wrap">{contract.terms}</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-muted-foreground" />
              Financial Summary
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Total Purchase Value</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatMoney(contract.total_purchase_value || 0)} PLN
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Monthly Contracted</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatMoney(contract.total_monthly_contracted || 0)} PLN
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Additional Services</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Warranty:</span>
                    <span className="font-medium">{formatMoney(contract.warranty_cost || 0)} PLN</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Implementation:</span>
                    <span className="font-medium">{formatMoney(contract.implementation_cost || 0)} PLN</span>
                  </div>
                  {(contract.other_services_cost && contract.other_services_cost > 0) && (
                    <div className="flex justify-between">
                      <span className="text-sm">{contract.other_services_description || 'Other Services'}:</span>
                      <span className="font-medium">{formatMoney(contract.other_services_cost)} PLN</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Associated Robots ({robots.length})</h2>
          </div>
          <div className="space-y-3">
            {robots.map((robot) => (
              <Card
                key={robot.id}
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/robots/${robot.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{robot.serial_number}</h3>
                    <p className="text-sm text-muted-foreground">{robot.model}</p>
                  </div>
                  <Badge className={statusColors[robot.status] || "bg-muted text-muted-foreground"}>
                    {robot.status.replace("_", " ")}
                  </Badge>
                </div>
              </Card>
            ))}
            {robots.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No robots associated with this contract</p>
              </div>
            )}
          </div>
        </Card>

        <ContractPdfGenerator
          contractId={contract.id}
          contractNumber={contract.contract_number}
          contractData={contract}
          clientData={client}
          robotsData={robots}
        />
      </div>
    </Layout>
  );
};

export default ContractDetail;
