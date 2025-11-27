import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { NewOfferDialog } from "@/components/offers/NewOfferDialog";
import { OfferPdfGenerator } from "@/components/offers/OfferPdfGenerator";
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
  status: string;
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
}

interface Client {
  id: string;
  name: string;
}

interface OfferItem {
  id: string;
  robot_model: string;
  quantity: number;
  unit_price: number;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary text-primary-foreground",
  modified: "bg-warning text-warning-foreground",
  accepted: "bg-success text-success-foreground",
  rejected: "bg-destructive text-destructive-foreground",
};

const OfferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [items, setItems] = useState<OfferItem[]>([]);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

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
        .select("id, name")
        .eq("id", offerData.client_id)
        .single();

      if (clientData) {
        setClient(clientData);
      }
    }

    const { data: itemsData } = await supabase
      .from("offer_items")
      .select("*")
      .eq("offer_id", id);

    if (itemsData) {
      setItems(itemsData);
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
          <Button onClick={() => setIsEditSheetOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Offer
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/10 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Offer Information</h2>
                <Badge className={statusColors[offer.status]}>{offer.status}</Badge>
              </div>
            </div>
            {offer.total_price && (
              <div className="text-right">
                <p className="text-3xl font-bold text-accent">
                  {offer.total_price.toFixed(2)} PLN
                </p>
                <p className="text-sm text-muted-foreground">total value</p>
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
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {new Date(offer.created_at).toLocaleDateString()}
                </p>
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
                        {item.unit_price.toFixed(2)} PLN
                      </TableCell>
                      <TableCell className="text-right">
                        {(item.quantity * item.unit_price).toFixed(2)} PLN
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-6 pt-6 border-t flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <p className="text-2xl font-bold text-accent">{subtotal.toFixed(2)} PLN</p>
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
    </Layout>
  );
};

export default OfferDetail;
