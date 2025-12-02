import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, Globe, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { formatMoney } from "@/lib/utils";

interface Reseller {
  id: string;
  name: string;
  nip: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  website_url: string | null;
  general_email: string | null;
  general_phone: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  billing_person_name: string | null;
  billing_person_email: string | null;
  billing_person_phone: string | null;
  status: string;
  balance: number | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  active: "bg-success text-success-foreground",
  inactive: "bg-muted text-muted-foreground",
  pending: "bg-warning text-warning-foreground",
};

const ResellerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reseller, setReseller] = useState<Reseller | null>(null);

  useEffect(() => {
    if (id) {
      fetchResellerData();
    }
  }, [id]);

  const fetchResellerData = async () => {
    const { data, error } = await supabase
      .from("resellers")
      .select("*")
      .eq("id", id)
      .single();

    if (data && !error) {
      setReseller(data);
    }
  };

  if (!reseller) {
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
          <Button variant="ghost" size="icon" onClick={() => navigate("/resellers")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{reseller.name}</h1>
            <p className="text-muted-foreground">Reseller Details</p>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Company Information</h2>
              <Badge className={statusColors[reseller.status]}>
                {reseller.status}
              </Badge>
            </div>
            {reseller.balance !== null && reseller.balance !== 0 && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-2xl font-bold text-primary">
                  {formatMoney(reseller.balance)} PLN
                </p>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {reseller.nip && (
                <div>
                  <p className="text-sm text-muted-foreground">NIP</p>
                  <p className="font-medium">{reseller.nip}</p>
                </div>
              )}
              {(reseller.address || reseller.city) && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address
                  </p>
                  <p className="font-medium">
                    {reseller.address && <>{reseller.address}<br /></>}
                    {reseller.postal_code && <>{reseller.postal_code} </>}
                    {reseller.city && <>{reseller.city}</>}
                    {reseller.country && <>, {reseller.country}</>}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {reseller.general_email && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    General Email
                  </p>
                  <a href={`mailto:${reseller.general_email}`} className="font-medium text-primary hover:underline">
                    {reseller.general_email}
                  </a>
                </div>
              )}
              {reseller.general_phone && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    General Phone
                  </p>
                  <a href={`tel:${reseller.general_phone}`} className="font-medium text-primary hover:underline">
                    {reseller.general_phone}
                  </a>
                </div>
              )}
              {reseller.website_url && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Website
                  </p>
                  <a 
                    href={reseller.website_url.startsWith('http') ? reseller.website_url : `https://${reseller.website_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {reseller.website_url}
                  </a>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Primary Contact</h3>
            <div className="space-y-3">
              {reseller.primary_contact_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{reseller.primary_contact_name}</p>
                </div>
              )}
              {reseller.primary_contact_email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a href={`mailto:${reseller.primary_contact_email}`} className="font-medium text-primary hover:underline">
                    {reseller.primary_contact_email}
                  </a>
                </div>
              )}
              {reseller.primary_contact_phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <a href={`tel:${reseller.primary_contact_phone}`} className="font-medium text-primary hover:underline">
                    {reseller.primary_contact_phone}
                  </a>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Billing Contact</h3>
            <div className="space-y-3">
              {reseller.billing_person_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{reseller.billing_person_name}</p>
                </div>
              )}
              {reseller.billing_person_email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a href={`mailto:${reseller.billing_person_email}`} className="font-medium text-primary hover:underline">
                    {reseller.billing_person_email}
                  </a>
                </div>
              )}
              {reseller.billing_person_phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <a href={`tel:${reseller.billing_person_phone}`} className="font-medium text-primary hover:underline">
                    {reseller.billing_person_phone}
                  </a>
                </div>
              )}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Created At</p>
              <p className="font-medium">
                {new Date(reseller.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ResellerDetail;
