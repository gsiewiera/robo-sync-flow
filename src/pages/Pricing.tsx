import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, DollarSign, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PricingFormSheet } from "@/components/pricing/PricingFormSheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RobotPricing {
  id: string;
  robot_model: string;
  sale_price_pln_net: number;
  sale_price_usd_net: number;
  sale_price_eur_net: number;
  promo_price_pln_net?: number;
  promo_price_usd_net?: number;
  promo_price_eur_net?: number;
  lowest_price_pln_net?: number;
  lowest_price_usd_net?: number;
  lowest_price_eur_net?: number;
  created_at: string;
}

interface LeasePricing {
  id: string;
  robot_pricing_id: string;
  months: number;
  price_pln_net: number;
  price_usd_net: number;
  price_eur_net: number;
}

const Pricing = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [pricings, setPricings] = useState<RobotPricing[]>([]);
  const [leasePricingData, setLeasePricingData] = useState<Record<string, LeasePricing[]>>({});
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<RobotPricing | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [vatRate, setVatRate] = useState(23);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminRole();
    fetchVatRate();
    fetchPricings();
  }, []);

  const checkAdminRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasAdminRole = userRoles?.some((r) => r.role === "admin");
    setIsAdmin(hasAdminRole || false);
  };

  const fetchVatRate = async () => {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "vat_rate")
      .single();

    if (!error && data) {
      setVatRate(parseFloat(data.value));
    }
  };

  const fetchPricings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("robot_pricing")
      .select("*")
      .order("robot_model");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch pricing data",
        variant: "destructive",
      });
    } else {
      setPricings(data || []);
      
      // Fetch lease pricing for each robot pricing
      if (data) {
        const leaseData: Record<string, LeasePricing[]> = {};
        for (const pricing of data) {
          const { data: leaseRecords } = await supabase
            .from("lease_pricing")
            .select("*")
            .eq("robot_pricing_id", pricing.id)
            .order("months");
          
          if (leaseRecords) {
            leaseData[pricing.id] = leaseRecords;
          }
        }
        setLeasePricingData(leaseData);
      }
    }
    setLoading(false);
  };

  const calculateGross = (net: number) => {
    return net * (1 + vatRate / 100);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleEdit = (pricing: RobotPricing) => {
    setEditingPricing(pricing);
    setSheetOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    const { error } = await supabase
      .from("robot_pricing")
      .delete()
      .eq("id", deletingId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete pricing",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Pricing deleted successfully",
      });
      fetchPricings();
    }

    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading pricing data...</p>
        </div>
      </Layout>
    );
  }

  if (!isAdmin && pricings.length === 0) {
    return (
      <Layout>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No pricing data available.</p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="h-8 w-8" />
              Pricing
            </h1>
            <p className="text-muted-foreground">Manage robot pricing and lease options</p>
          </div>
          {isAdmin && (
            <Button onClick={() => { setEditingPricing(null); setSheetOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Pricing
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {pricings.map((pricing) => (
            <Card key={pricing.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{pricing.robot_model}</h3>
                    <p className="text-sm text-muted-foreground">Robot Model</p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(pricing)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => confirmDelete(pricing.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Sale Section */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      Sale Prices
                      <Badge variant="secondary">VAT: {vatRate}%</Badge>
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Currency</TableHead>
                          <TableHead className="text-right">Net</TableHead>
                          <TableHead className="text-right">Gross</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">PLN</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(pricing.sale_price_pln_net, "PLN")}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(calculateGross(pricing.sale_price_pln_net), "PLN")}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">USD</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(pricing.sale_price_usd_net, "USD")}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(calculateGross(pricing.sale_price_usd_net), "USD")}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">EUR</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(pricing.sale_price_eur_net, "EUR")}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(calculateGross(pricing.sale_price_eur_net), "EUR")}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    {(pricing.promo_price_pln_net || pricing.promo_price_usd_net || pricing.promo_price_eur_net) && (
                      <>
                        <h5 className="font-semibold mt-4 mb-2 flex items-center gap-2">
                          Promo Prices
                          <Badge variant="default">Active</Badge>
                        </h5>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Currency</TableHead>
                              <TableHead className="text-right">Net</TableHead>
                              <TableHead className="text-right">Gross</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pricing.promo_price_pln_net && (
                              <TableRow>
                                <TableCell className="font-medium">PLN</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(pricing.promo_price_pln_net, "PLN")}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(calculateGross(pricing.promo_price_pln_net), "PLN")}
                                </TableCell>
                              </TableRow>
                            )}
                            {pricing.promo_price_usd_net && (
                              <TableRow>
                                <TableCell className="font-medium">USD</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(pricing.promo_price_usd_net, "USD")}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(calculateGross(pricing.promo_price_usd_net), "USD")}
                                </TableCell>
                              </TableRow>
                            )}
                            {pricing.promo_price_eur_net && (
                              <TableRow>
                                <TableCell className="font-medium">EUR</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(pricing.promo_price_eur_net, "EUR")}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(calculateGross(pricing.promo_price_eur_net), "EUR")}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </>
                    )}

                    {isAdmin && (pricing.lowest_price_pln_net || pricing.lowest_price_usd_net || pricing.lowest_price_eur_net) && (
                      <>
                        <h5 className="font-semibold mt-4 mb-2 flex items-center gap-2">
                          Lowest Prices
                          <Badge variant="destructive">Admin Only</Badge>
                        </h5>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Currency</TableHead>
                              <TableHead className="text-right">Net</TableHead>
                              <TableHead className="text-right">Gross</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pricing.lowest_price_pln_net && (
                              <TableRow>
                                <TableCell className="font-medium">PLN</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(pricing.lowest_price_pln_net, "PLN")}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(calculateGross(pricing.lowest_price_pln_net), "PLN")}
                                </TableCell>
                              </TableRow>
                            )}
                            {pricing.lowest_price_usd_net && (
                              <TableRow>
                                <TableCell className="font-medium">USD</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(pricing.lowest_price_usd_net, "USD")}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(calculateGross(pricing.lowest_price_usd_net), "USD")}
                                </TableCell>
                              </TableRow>
                            )}
                            {pricing.lowest_price_eur_net && (
                              <TableRow>
                                <TableCell className="font-medium">EUR</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(pricing.lowest_price_eur_net, "EUR")}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(calculateGross(pricing.lowest_price_eur_net), "EUR")}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </>
                    )}
                  </div>

                  {/* Lease Section */}
                  <div>
                    <h4 className="font-semibold mb-3">Lease Options</h4>
                    {leasePricingData[pricing.id] && leasePricingData[pricing.id].length > 0 ? (
                      <div className="space-y-4">
                        {leasePricingData[pricing.id].map((lease) => (
                          <div key={lease.id} className="border-b pb-3 last:border-b-0">
                            <h5 className="font-medium mb-2">{lease.months} Months</h5>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">PLN:</span>
                                <div className="text-right">
                                  <div>{formatCurrency(lease.price_pln_net, "PLN")} / month (net)</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatCurrency(calculateGross(lease.price_pln_net), "PLN")} / month (gross)
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">USD:</span>
                                <div className="text-right">
                                  <div>{formatCurrency(lease.price_usd_net, "USD")} / month (net)</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatCurrency(calculateGross(lease.price_usd_net), "USD")} / month (gross)
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">EUR:</span>
                                <div className="text-right">
                                  <div>{formatCurrency(lease.price_eur_net, "EUR")} / month (net)</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatCurrency(calculateGross(lease.price_eur_net), "EUR")} / month (gross)
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No lease options configured
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <PricingFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        pricing={editingPricing}
        onSuccess={() => {
          fetchPricings();
          setSheetOpen(false);
          setEditingPricing(null);
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pricing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this pricing? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Pricing;
