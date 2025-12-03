import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Edit, FileText, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { formatMoney } from "@/lib/utils";
import { NewOfferDialog } from "@/components/offers/NewOfferDialog";
import { OfferPdfGenerator } from "@/components/offers/OfferPdfGenerator";
import { CreateContractDialog } from "@/components/offers/CreateContractDialog";
import { OfferStageSelector } from "@/components/offers/OfferStageSelector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Offer {
  id: string;
  offer_number: string;
  stage: string;
  total_price: number | null;
  notes: string | null;
  created_at: string;
  client_id: string;
  currency: string;
  person_contact?: string;
  warranty_period: number;
  delivery_date?: string;
  deployment_location?: string;
  initial_payment: number;
  prepayment_percent?: number;
  prepayment_amount?: number;
  reseller_id?: string;
}

interface Client {
  id: string;
  name: string;
  general_email?: string;
  primary_contact_email?: string;
}

interface OfferItem {
  id: string;
  robot_model: string;
  quantity: number;
  unit_price: number;
  contract_type?: string;
  lease_months?: number;
}

interface RobotPricing {
  robot_model: string;
  evidence_price_pln_net: number | null;
}

interface LeasePricing {
  robot_pricing_id: string;
  months: number;
  evidence_price_pln_net: number | null;
}

const stageColors: Record<string, string> = {
  leads: "bg-gray-500",
  qualified: "bg-blue-500",
  proposal_sent: "bg-yellow-500",
  negotiation: "bg-orange-500",
  closed_won: "bg-green-500",
  closed_lost: "bg-red-500",
};

const OfferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [reseller, setReseller] = useState<{ id: string; name: string } | null>(null);
  const [items, setItems] = useState<OfferItem[]>([]);
  const [robotPricing, setRobotPricing] = useState<RobotPricing[]>([]);
  const [leasePricing, setLeasePricing] = useState<LeasePricing[]>([]);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOfferData();
    }
  }, [id]);

  const fetchOfferData = async () => {
    const { data: offerData } = await supabase
      .from("offers")
      .select("*")
      .eq("id", id)
      .single();

    if (offerData) {
      setOffer(offerData);

      const { data: clientData } = await supabase
        .from("clients")
        .select("id, name, general_email, primary_contact_email")
        .eq("id", offerData.client_id)
        .single();

      if (clientData) {
        setClient(clientData);
      }

      // Fetch reseller if present
      if (offerData.reseller_id) {
        const { data: resellerData } = await supabase
          .from("resellers")
          .select("id, name")
          .eq("id", offerData.reseller_id)
          .single();

        if (resellerData) {
          setReseller(resellerData);
        }
      }
    }

    const { data: itemsData } = await supabase
      .from("offer_items")
      .select("*")
      .eq("offer_id", id);

    if (itemsData) {
      setItems(itemsData);
    }

    // Fetch robot pricing for margin calculation
    const { data: robotPricingData } = await supabase
      .from("robot_pricing")
      .select("robot_model, evidence_price_pln_net");
    
    if (robotPricingData) {
      setRobotPricing(robotPricingData);
    }

    // Fetch lease pricing
    const { data: leasePricingData } = await supabase
      .from("lease_pricing")
      .select("robot_pricing_id, months, evidence_price_pln_net");
    
    if (leasePricingData) {
      setLeasePricing(leasePricingData);
    }
  };

  if (!offer) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  // Calculate item margin
  const getItemMargin = (item: OfferItem): number => {
    const robotCost = robotPricing.find(rp => rp.robot_model === item.robot_model);
    const quantity = item.quantity || 1;
    
    if (item.contract_type === 'lease' && item.lease_months) {
      // For lease, find lease pricing entry via robot_pricing_id
      const robotPricingEntry = robotPricing.find(rp => rp.robot_model === item.robot_model);
      if (robotPricingEntry) {
        // Find lease entry by matching robot model and months
        const { data: robotPricingIds } = { data: null }; // We need to get robot_pricing_id
        const leaseEntry = leasePricing.find(lp => lp.months === item.lease_months);
        if (leaseEntry?.evidence_price_pln_net) {
          return ((item.unit_price || 0) - (leaseEntry.evidence_price_pln_net || 0)) * quantity * item.lease_months;
        }
      }
    } else {
      // For purchase
      if (robotCost?.evidence_price_pln_net) {
        return ((item.unit_price || 0) - (robotCost.evidence_price_pln_net || 0)) * quantity;
      }
    }
    return 0;
  };

  const totalMargin = items.reduce((sum, item) => sum + getItemMargin(item), 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/offers")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{offer.offer_number}</h1>
            <p className="text-muted-foreground">Offer Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(offer.stage === 'negotiation' || offer.stage === 'closed_won') && (
            <Button variant="outline" onClick={() => setIsContractDialogOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Create Contract
            </Button>
          )}
          <Button onClick={() => setIsEditSheetOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Offer
          </Button>
        </div>
        </div>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/10 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Offer Information</h2>
                <Badge className={stageColors[offer.stage]}>
                  {offer.stage.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </Badge>
              </div>
            </div>
            {offer.total_price && (
              <div className="text-right space-y-2">
                <div>
                  <p className="text-3xl font-bold text-accent">
                    {formatMoney(offer.total_price)} PLN
                  </p>
                  <p className="text-sm text-muted-foreground">total value</p>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-2xl font-bold text-emerald-500">
                    {formatMoney(totalMargin)} PLN
                  </p>
                  <p className="text-sm text-emerald-600 flex items-center justify-end gap-1">
                    <TrendingUp className="w-3 h-3" />
                    profit margin
                  </p>
                </div>
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
              {reseller && (
                <div>
                  <p className="text-sm text-muted-foreground">Reseller Partner</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-lg"
                    onClick={() => navigate(`/resellers/${reseller.id}`)}
                  >
                    {reseller.name}
                  </Button>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {new Date(offer.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <div className="pt-2">
                <OfferStageSelector 
                  offerId={offer.id}
                  currentStage={offer.stage || 'leads'}
                  onStageChange={fetchOfferData}
                />
              </div>
            </div>

            {offer.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{offer.notes}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Offer Items</h2>
          {items.length > 0 ? (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Robot Model</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.robot_model}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(item.unit_price)} PLN
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(item.quantity * item.unit_price)} PLN
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-6 pt-6 border-t flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <p className="text-2xl font-bold text-accent">{formatMoney(subtotal)} PLN</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No items in this offer</p>
            </div>
          )}
        </Card>

        <OfferPdfGenerator
          offerId={offer.id}
          offerNumber={offer.offer_number}
          offerData={offer}
          clientData={client}
          itemsData={items}
        />
      </div>

      <NewOfferDialog
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        onSuccess={() => {
          fetchOfferData();
        }}
        offer={offer}
      />

      <CreateContractDialog
        open={isContractDialogOpen}
        onOpenChange={setIsContractDialogOpen}
        offerId={offer.id}
        clientId={offer.client_id}
        offerData={offer}
        offerItems={items}
        resellerId={offer.reseller_id}
      />
    </Layout>
  );
};

export default OfferDetail;
