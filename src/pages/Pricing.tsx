import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, DollarSign, Edit, Trash2, Eye, ArrowLeft } from "lucide-react";
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
  const [selectedPricing, setSelectedPricing] = useState<RobotPricing | null>(null);
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
      if (selectedPricing?.id === deletingId) {
        setSelectedPricing(null);
      }
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

  // Detail View
  if (selectedPricing) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedPricing(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{selectedPricing.robot_model}</h1>
                <p className="text-muted-foreground">Pricing Details</p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleEdit(selectedPricing)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => confirmDelete(selectedPricing.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          <Card>
            <CardContent className="pt-6">
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
                          {formatCurrency(selectedPricing.sale_price_pln_net, "PLN")}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(calculateGross(selectedPricing.sale_price_pln_net), "PLN")}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">USD</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(selectedPricing.sale_price_usd_net, "USD")}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(calculateGross(selectedPricing.sale_price_usd_net), "USD")}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">EUR</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(selectedPricing.sale_price_eur_net, "EUR")}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(calculateGross(selectedPricing.sale_price_eur_net), "EUR")}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  {(selectedPricing.promo_price_pln_net || selectedPricing.promo_price_usd_net || selectedPricing.promo_price_eur_net) && (
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
                          {selectedPricing.promo_price_pln_net && (
                            <TableRow>
                              <TableCell className="font-medium">PLN</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(selectedPricing.promo_price_pln_net, "PLN")}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(calculateGross(selectedPricing.promo_price_pln_net), "PLN")}
                              </TableCell>
                            </TableRow>
                          )}
                          {selectedPricing.promo_price_usd_net && (
                            <TableRow>
                              <TableCell className="font-medium">USD</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(selectedPricing.promo_price_usd_net, "USD")}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(calculateGross(selectedPricing.promo_price_usd_net), "USD")}
                              </TableCell>
                            </TableRow>
                          )}
                          {selectedPricing.promo_price_eur_net && (
                            <TableRow>
                              <TableCell className="font-medium">EUR</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(selectedPricing.promo_price_eur_net, "EUR")}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(calculateGross(selectedPricing.promo_price_eur_net), "EUR")}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </>
                  )}

                  {isAdmin && (selectedPricing.lowest_price_pln_net || selectedPricing.lowest_price_usd_net || selectedPricing.lowest_price_eur_net) && (
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
                          {selectedPricing.lowest_price_pln_net && (
                            <TableRow>
                              <TableCell className="font-medium">PLN</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(selectedPricing.lowest_price_pln_net, "PLN")}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(calculateGross(selectedPricing.lowest_price_pln_net), "PLN")}
                              </TableCell>
                            </TableRow>
                          )}
                          {selectedPricing.lowest_price_usd_net && (
                            <TableRow>
                              <TableCell className="font-medium">USD</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(selectedPricing.lowest_price_usd_net, "USD")}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(calculateGross(selectedPricing.lowest_price_usd_net), "USD")}
                              </TableCell>
                            </TableRow>
                          )}
                          {selectedPricing.lowest_price_eur_net && (
                            <TableRow>
                              <TableCell className="font-medium">EUR</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(selectedPricing.lowest_price_eur_net, "EUR")}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(calculateGross(selectedPricing.lowest_price_eur_net), "EUR")}
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
                  {leasePricingData[selectedPricing.id] && leasePricingData[selectedPricing.id].length > 0 ? (
                    <div className="space-y-4">
                      {leasePricingData[selectedPricing.id].map((lease) => (
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
        </div>

        <PricingFormSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          pricing={editingPricing}
          onSuccess={() => {
            fetchPricings();
            setSheetOpen(false);
            setEditingPricing(null);
            // Update selectedPricing if it was being edited
            if (editingPricing && selectedPricing?.id === editingPricing.id) {
              const updatedPricing = pricings.find(p => p.id === editingPricing.id);
              if (updatedPricing) setSelectedPricing(updatedPricing);
            }
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
  }

  // List View
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

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Robot Model</TableHead>
                <TableHead className="text-right">Sale Price (PLN)</TableHead>
                <TableHead className="text-right">Sale Price (EUR)</TableHead>
                <TableHead className="text-right">Sale Price (USD)</TableHead>
                <TableHead>Promo</TableHead>
                <TableHead>Lease Options</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No pricing data available
                  </TableCell>
                </TableRow>
              ) : (
                pricings.map((pricing) => (
                  <TableRow 
                    key={pricing.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedPricing(pricing)}
                  >
                    <TableCell className="font-medium">{pricing.robot_model}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(pricing.sale_price_pln_net, "PLN")}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(pricing.sale_price_eur_net, "EUR")}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(pricing.sale_price_usd_net, "USD")}
                    </TableCell>
                    <TableCell>
                      {(pricing.promo_price_pln_net || pricing.promo_price_usd_net || pricing.promo_price_eur_net) ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {leasePricingData[pricing.id]?.length || 0} options
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setSelectedPricing(pricing)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(pricing)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
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
