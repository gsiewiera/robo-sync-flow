import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

interface Offer {
  id: string;
  offer_number: string;
  status: string;
  total_price: number | null;
  created_at: string;
  clients: { name: string } | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary text-primary-foreground",
  modified: "bg-warning text-warning-foreground",
  accepted: "bg-success text-success-foreground",
  rejected: "bg-destructive text-destructive-foreground",
};

const Offers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    const { data, error } = await supabase
      .from("offers")
      .select("*, clients(name)")
      .order("created_at", { ascending: false });

    if (data && !error) {
      setOffers(data);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Offers</h1>
          <p className="text-muted-foreground">Track sales opportunities and proposals</p>
        </div>

        <div className="grid gap-4">
          {offers.map((offer) => (
            <Card
              key={offer.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/offers/${offer.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-accent" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{offer.offer_number}</h3>
                      <Badge className={statusColors[offer.status]}>
                        {offer.status}
                      </Badge>
                    </div>
                    {offer.clients && (
                      <p className="text-sm text-muted-foreground">
                        Client: {offer.clients.name}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(offer.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {offer.total_price && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-accent">
                      {offer.total_price.toFixed(2)} PLN
                    </p>
                    <p className="text-sm text-muted-foreground">total value</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {offers.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No offers found</p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Offers;
