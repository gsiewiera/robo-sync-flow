import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, DollarSign, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PricingDetailForm } from "@/components/pricing/PricingDetailForm";
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
import { ColumnVisibilityToggle, ColumnConfig } from "@/components/ui/column-visibility-toggle";

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
  evidence_price_pln_net?: number;
  evidence_price_usd_net?: number;
  evidence_price_eur_net?: number;
  created_at: string;
}

interface LeasePricing {
  id: string;
  robot_pricing_id: string;
  months: number;
  price_pln_net: number;
  price_usd_net: number;
  price_eur_net: number;
  evidence_price_pln_net?: number;
  evidence_price_usd_net?: number;
  evidence_price_eur_net?: number;
}

const Pricing = () => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [pricings, setPricings] = useState<RobotPricing[]>([]);
  const [leasePricingData, setLeasePricingData] = useState<Record<string, LeasePricing[]>>({});
  const [loading, setLoading] = useState(true);
  const [vatRate, setVatRate] = useState(23);
  const [selectedPricing, setSelectedPricing] = useState<RobotPricing | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();

  const columns: ColumnConfig[] = [
    { key: "robot_model", label: "Robot Model", defaultVisible: true },
    { key: "sale_pln", label: "Sale Price (PLN)", defaultVisible: true },
    { key: "sale_eur", label: "Sale Price (EUR)", defaultVisible: true },
    { key: "sale_usd", label: "Sale Price (USD)", defaultVisible: true },
    { key: "promo", label: "Promo", defaultVisible: true },
    { key: "lease", label: "Lease Options", defaultVisible: true },
  ];

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.filter((col) => col.defaultVisible).map((col) => col.key)
  );

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  // Reset to list view when navigating to this route
  useEffect(() => {
    setSelectedPricing(null);
  }, [location.key]);

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

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
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
        <PricingDetailForm
          pricing={selectedPricing}
          leasePricing={leasePricingData[selectedPricing.id] || []}
          vatRate={vatRate}
          isAdmin={isAdmin}
          onBack={() => setSelectedPricing(null)}
          onSave={() => {
            fetchPricings();
            // Update selectedPricing with fresh data
            supabase
              .from("robot_pricing")
              .select("*")
              .eq("id", selectedPricing.id)
              .single()
              .then(({ data }) => {
                if (data) setSelectedPricing(data);
              });
          }}
        />
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
          <div className="flex items-center gap-2">
            <ColumnVisibilityToggle
              columns={columns}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
            />
            {isAdmin && (
              <Button onClick={() => setSheetOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Pricing
              </Button>
            )}
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow className="h-9">
                {visibleColumns.includes("robot_model") && (
                  <TableHead className="py-1.5 text-xs">Robot Model</TableHead>
                )}
                {visibleColumns.includes("sale_pln") && (
                  <TableHead className="text-right py-1.5 text-xs">Sale Price (PLN)</TableHead>
                )}
                {visibleColumns.includes("sale_eur") && (
                  <TableHead className="text-right py-1.5 text-xs">Sale Price (EUR)</TableHead>
                )}
                {visibleColumns.includes("sale_usd") && (
                  <TableHead className="text-right py-1.5 text-xs">Sale Price (USD)</TableHead>
                )}
                {visibleColumns.includes("promo") && (
                  <TableHead className="py-1.5 text-xs">Promo</TableHead>
                )}
                {visibleColumns.includes("lease") && (
                  <TableHead className="py-1.5 text-xs">Lease Options</TableHead>
                )}
                <TableHead className="w-16 py-1.5 text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground text-sm">
                    No pricing data available
                  </TableCell>
                </TableRow>
              ) : (
                pricings.map((pricing) => (
                  <TableRow 
                    key={pricing.id} 
                    className="h-9 cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedPricing(pricing)}
                  >
                    {visibleColumns.includes("robot_model") && (
                      <TableCell className="py-1.5 text-sm font-medium">{pricing.robot_model}</TableCell>
                    )}
                    {visibleColumns.includes("sale_pln") && (
                      <TableCell className="text-right py-1.5 text-sm">
                        {formatCurrency(pricing.sale_price_pln_net, "PLN")}
                      </TableCell>
                    )}
                    {visibleColumns.includes("sale_eur") && (
                      <TableCell className="text-right py-1.5 text-sm">
                        {formatCurrency(pricing.sale_price_eur_net, "EUR")}
                      </TableCell>
                    )}
                    {visibleColumns.includes("sale_usd") && (
                      <TableCell className="text-right py-1.5 text-sm">
                        {formatCurrency(pricing.sale_price_usd_net, "USD")}
                      </TableCell>
                    )}
                    {visibleColumns.includes("promo") && (
                      <TableCell className="py-1.5">
                        {(pricing.promo_price_pln_net || pricing.promo_price_usd_net || pricing.promo_price_eur_net) ? (
                          <Badge variant="default" className="text-xs px-1.5 py-0">Active</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.includes("lease") && (
                      <TableCell className="py-1.5 text-sm">
                        {leasePricingData[pricing.id]?.length || 0} options
                      </TableCell>
                    )}
                    <TableCell className="py-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setSelectedPricing(pricing)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
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
        pricing={null}
        isAdmin={isAdmin}
        onSuccess={() => {
          fetchPricings();
          setSheetOpen(false);
        }}
      />
    </Layout>
  );
};

export default Pricing;
