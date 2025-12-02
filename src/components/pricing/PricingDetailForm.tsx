import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface PricingDetailFormProps {
  pricing: RobotPricing;
  leasePricing: LeasePricing[];
  vatRate: number;
  isAdmin: boolean;
  onBack: () => void;
  onSave: () => void;
}

export const PricingDetailForm = ({
  pricing,
  leasePricing,
  vatRate,
  isAdmin,
  onBack,
  onSave,
}: PricingDetailFormProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    sale_price_pln_net: pricing.sale_price_pln_net,
    sale_price_usd_net: pricing.sale_price_usd_net,
    sale_price_eur_net: pricing.sale_price_eur_net,
    promo_price_pln_net: pricing.promo_price_pln_net || 0,
    promo_price_usd_net: pricing.promo_price_usd_net || 0,
    promo_price_eur_net: pricing.promo_price_eur_net || 0,
    lowest_price_pln_net: pricing.lowest_price_pln_net || 0,
    lowest_price_usd_net: pricing.lowest_price_usd_net || 0,
    lowest_price_eur_net: pricing.lowest_price_eur_net || 0,
  });

  const [leaseData, setLeaseData] = useState<Record<number, { pln: number; usd: number; eur: number }>>(
    {}
  );

  useEffect(() => {
    const leaseMap: Record<number, { pln: number; usd: number; eur: number }> = {};
    leasePricing.forEach((lease) => {
      leaseMap[lease.months] = {
        pln: lease.price_pln_net,
        usd: lease.price_usd_net,
        eur: lease.price_eur_net,
      };
    });
    setLeaseData(leaseMap);
  }, [leasePricing]);

  const calculateGross = (net: number) => net * (1 + vatRate / 100);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handleLeaseChange = (months: number, currency: "pln" | "usd" | "eur", value: string) => {
    setLeaseData((prev) => ({
      ...prev,
      [months]: {
        ...prev[months],
        [currency]: parseFloat(value) || 0,
      },
    }));
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    setSaving(true);

    try {
      const { error: pricingError } = await supabase
        .from("robot_pricing")
        .update({
          sale_price_pln_net: formData.sale_price_pln_net,
          sale_price_usd_net: formData.sale_price_usd_net,
          sale_price_eur_net: formData.sale_price_eur_net,
          promo_price_pln_net: formData.promo_price_pln_net || null,
          promo_price_usd_net: formData.promo_price_usd_net || null,
          promo_price_eur_net: formData.promo_price_eur_net || null,
          lowest_price_pln_net: formData.lowest_price_pln_net || null,
          lowest_price_usd_net: formData.lowest_price_usd_net || null,
          lowest_price_eur_net: formData.lowest_price_eur_net || null,
        })
        .eq("id", pricing.id);

      if (pricingError) throw pricingError;

      // Update lease pricing
      for (const [months, prices] of Object.entries(leaseData)) {
        const existingLease = leasePricing.find((l) => l.months === parseInt(months));
        if (existingLease) {
          await supabase
            .from("lease_pricing")
            .update({
              price_pln_net: prices.pln,
              price_usd_net: prices.usd,
              price_eur_net: prices.eur,
            })
            .eq("id", existingLease.id);
        }
      }

      toast({ title: "Success", description: "Pricing updated successfully" });
      setIsEditing(false);
      onSave();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save pricing", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      sale_price_pln_net: pricing.sale_price_pln_net,
      sale_price_usd_net: pricing.sale_price_usd_net,
      sale_price_eur_net: pricing.sale_price_eur_net,
      promo_price_pln_net: pricing.promo_price_pln_net || 0,
      promo_price_usd_net: pricing.promo_price_usd_net || 0,
      promo_price_eur_net: pricing.promo_price_eur_net || 0,
      lowest_price_pln_net: pricing.lowest_price_pln_net || 0,
      lowest_price_usd_net: pricing.lowest_price_usd_net || 0,
      lowest_price_eur_net: pricing.lowest_price_eur_net || 0,
    });
    const leaseMap: Record<number, { pln: number; usd: number; eur: number }> = {};
    leasePricing.forEach((lease) => {
      leaseMap[lease.months] = {
        pln: lease.price_pln_net,
        usd: lease.price_usd_net,
        eur: lease.price_eur_net,
      };
    });
    setLeaseData(leaseMap);
    setIsEditing(false);
  };

  const PriceField = ({
    label,
    field,
    currency,
  }: {
    label: string;
    field: keyof typeof formData;
    currency: string;
  }) => {
    const value = formData[field];
    const gross = calculateGross(value);

    return (
      <div className="grid grid-cols-3 gap-4 items-center py-2 border-b border-border last:border-b-0">
        <Label className="font-medium">{label}</Label>
        {isEditing ? (
          <Input
            type="number"
            step="0.01"
            value={value || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="h-9"
          />
        ) : (
          <span className="text-right">{formatCurrency(value, currency)}</span>
        )}
        <span className="text-right text-muted-foreground">{formatCurrency(gross, currency)}</span>
      </div>
    );
  };

  const LeaseField = ({
    months,
    currency,
    currencyCode,
  }: {
    months: number;
    currency: "pln" | "usd" | "eur";
    currencyCode: string;
  }) => {
    const value = leaseData[months]?.[currency] || 0;
    const gross = calculateGross(value);

    return (
      <div className="grid grid-cols-3 gap-4 items-center py-1">
        <Label className="text-sm text-muted-foreground">{currencyCode}</Label>
        {isEditing ? (
          <Input
            type="number"
            step="0.01"
            value={value || ""}
            onChange={(e) => handleLeaseChange(months, currency, e.target.value)}
            className="h-8 text-sm"
          />
        ) : (
          <span className="text-right text-sm">{formatCurrency(value, currencyCode)}/mo</span>
        )}
        <span className="text-right text-xs text-muted-foreground">
          {formatCurrency(gross, currencyCode)}/mo
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{pricing.robot_model}</h1>
            <p className="text-sm text-muted-foreground">Pricing Details</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setIsEditing(true)}>
                Edit Pricing
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sale Prices */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Sale Prices
              <Badge variant="outline" className="font-normal">VAT: {vatRate}%</Badge>
            </CardTitle>
            <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground pt-2">
              <span>Currency</span>
              <span className="text-right">Net</span>
              <span className="text-right">Gross</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <PriceField label="PLN" field="sale_price_pln_net" currency="PLN" />
            <PriceField label="USD" field="sale_price_usd_net" currency="USD" />
            <PriceField label="EUR" field="sale_price_eur_net" currency="EUR" />
          </CardContent>
        </Card>

        {/* Promo Prices */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Promo Prices
              {(formData.promo_price_pln_net || formData.promo_price_usd_net || formData.promo_price_eur_net) && (
                <Badge>Active</Badge>
              )}
            </CardTitle>
            <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground pt-2">
              <span>Currency</span>
              <span className="text-right">Net</span>
              <span className="text-right">Gross</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <PriceField label="PLN" field="promo_price_pln_net" currency="PLN" />
            <PriceField label="USD" field="promo_price_usd_net" currency="USD" />
            <PriceField label="EUR" field="promo_price_eur_net" currency="EUR" />
          </CardContent>
        </Card>

        {/* Lowest Prices - Admin Only */}
        {isAdmin && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Lowest Prices
                <Badge variant="destructive">Admin Only</Badge>
              </CardTitle>
              <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground pt-2">
                <span>Currency</span>
                <span className="text-right">Net</span>
                <span className="text-right">Gross</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <PriceField label="PLN" field="lowest_price_pln_net" currency="PLN" />
              <PriceField label="USD" field="lowest_price_usd_net" currency="USD" />
              <PriceField label="EUR" field="lowest_price_eur_net" currency="EUR" />
            </CardContent>
          </Card>
        )}

        {/* Lease Options */}
        <Card className={isAdmin ? "" : "lg:col-span-1"}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lease Options</CardTitle>
            <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground pt-2">
              <span>Currency</span>
              <span className="text-right">Net/mo</span>
              <span className="text-right">Gross/mo</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {leasePricing.length > 0 ? (
              leasePricing.map((lease) => (
                <div key={lease.id} className="space-y-1">
                  <Label className="font-medium text-sm">{lease.months} Months</Label>
                  <LeaseField months={lease.months} currency="pln" currencyCode="PLN" />
                  <LeaseField months={lease.months} currency="usd" currencyCode="USD" />
                  <LeaseField months={lease.months} currency="eur" currencyCode="EUR" />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No lease options configured</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
