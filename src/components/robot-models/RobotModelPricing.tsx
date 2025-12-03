import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Pencil, Save, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RobotPricing {
  id: string;
  robot_model: string;
  sale_price_pln_net: number;
  sale_price_usd_net: number;
  sale_price_eur_net: number;
  promo_price_pln_net?: number | null;
  promo_price_usd_net?: number | null;
  promo_price_eur_net?: number | null;
  lowest_price_pln_net?: number | null;
  lowest_price_usd_net?: number | null;
  lowest_price_eur_net?: number | null;
  evidence_price_pln_net?: number | null;
  evidence_price_usd_net?: number | null;
  evidence_price_eur_net?: number | null;
}

interface LeasePricing {
  id: string;
  robot_pricing_id: string;
  months: number;
  price_pln_net: number;
  price_usd_net: number;
  price_eur_net: number;
  evidence_price_pln_net?: number | null;
  evidence_price_usd_net?: number | null;
  evidence_price_eur_net?: number | null;
}

interface RobotModelPricingProps {
  modelName: string;
  isAdmin: boolean;
}

export const RobotModelPricing = ({ modelName, isAdmin }: RobotModelPricingProps) => {
  const [pricing, setPricing] = useState<RobotPricing | null>(null);
  const [leasePricing, setLeasePricing] = useState<LeasePricing[]>([]);
  const [leaseMonths, setLeaseMonths] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    sale_price_pln_net: "",
    sale_price_usd_net: "",
    sale_price_eur_net: "",
    promo_price_pln_net: "",
    promo_price_usd_net: "",
    promo_price_eur_net: "",
    lowest_price_pln_net: "",
    lowest_price_usd_net: "",
    lowest_price_eur_net: "",
    evidence_price_pln_net: "",
    evidence_price_usd_net: "",
    evidence_price_eur_net: "",
  });

  const [leaseFormData, setLeaseFormData] = useState<Record<string, { pln: string; usd: string; eur: string }>>({});

  useEffect(() => {
    fetchPricing();
    fetchLeaseMonths();
  }, [modelName]);

  const fetchPricing = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("robot_pricing")
      .select("*")
      .eq("robot_model", modelName)
      .maybeSingle();

    if (error) {
      console.error("Error fetching pricing:", error);
    } else if (data) {
      setPricing(data);
      setFormData({
        sale_price_pln_net: data.sale_price_pln_net?.toString() || "",
        sale_price_usd_net: data.sale_price_usd_net?.toString() || "",
        sale_price_eur_net: data.sale_price_eur_net?.toString() || "",
        promo_price_pln_net: data.promo_price_pln_net?.toString() || "",
        promo_price_usd_net: data.promo_price_usd_net?.toString() || "",
        promo_price_eur_net: data.promo_price_eur_net?.toString() || "",
        lowest_price_pln_net: data.lowest_price_pln_net?.toString() || "",
        lowest_price_usd_net: data.lowest_price_usd_net?.toString() || "",
        lowest_price_eur_net: data.lowest_price_eur_net?.toString() || "",
        evidence_price_pln_net: data.evidence_price_pln_net?.toString() || "",
        evidence_price_usd_net: data.evidence_price_usd_net?.toString() || "",
        evidence_price_eur_net: data.evidence_price_eur_net?.toString() || "",
      });

      // Fetch lease pricing
      const { data: leaseData } = await supabase
        .from("lease_pricing")
        .select("*")
        .eq("robot_pricing_id", data.id)
        .order("months");

      if (leaseData) {
        setLeasePricing(leaseData);
        const leaseObj: Record<string, { pln: string; usd: string; eur: string }> = {};
        leaseData.forEach((item) => {
          leaseObj[item.months.toString()] = {
            pln: item.price_pln_net?.toString() || "",
            usd: item.price_usd_net?.toString() || "",
            eur: item.price_eur_net?.toString() || "",
          };
        });
        setLeaseFormData(leaseObj);
      }
    }
    setLoading(false);
  };

  const fetchLeaseMonths = async () => {
    const { data } = await supabase
      .from("lease_month_dictionary")
      .select("months")
      .order("months");

    if (data) {
      setLeaseMonths(data.map((d) => d.months));
    }
  };

  const formatCurrency = (amount: number | null | undefined, currency: string) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (pricing) {
      setFormData({
        sale_price_pln_net: pricing.sale_price_pln_net?.toString() || "",
        sale_price_usd_net: pricing.sale_price_usd_net?.toString() || "",
        sale_price_eur_net: pricing.sale_price_eur_net?.toString() || "",
        promo_price_pln_net: pricing.promo_price_pln_net?.toString() || "",
        promo_price_usd_net: pricing.promo_price_usd_net?.toString() || "",
        promo_price_eur_net: pricing.promo_price_eur_net?.toString() || "",
        lowest_price_pln_net: pricing.lowest_price_pln_net?.toString() || "",
        lowest_price_usd_net: pricing.lowest_price_usd_net?.toString() || "",
        lowest_price_eur_net: pricing.lowest_price_eur_net?.toString() || "",
        evidence_price_pln_net: pricing.evidence_price_pln_net?.toString() || "",
        evidence_price_usd_net: pricing.evidence_price_usd_net?.toString() || "",
        evidence_price_eur_net: pricing.evidence_price_eur_net?.toString() || "",
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);

    const pricingData = {
      robot_model: modelName,
      sale_price_pln_net: parseFloat(formData.sale_price_pln_net) || 0,
      sale_price_usd_net: parseFloat(formData.sale_price_usd_net) || 0,
      sale_price_eur_net: parseFloat(formData.sale_price_eur_net) || 0,
      promo_price_pln_net: formData.promo_price_pln_net ? parseFloat(formData.promo_price_pln_net) : null,
      promo_price_usd_net: formData.promo_price_usd_net ? parseFloat(formData.promo_price_usd_net) : null,
      promo_price_eur_net: formData.promo_price_eur_net ? parseFloat(formData.promo_price_eur_net) : null,
      lowest_price_pln_net: formData.lowest_price_pln_net ? parseFloat(formData.lowest_price_pln_net) : null,
      lowest_price_usd_net: formData.lowest_price_usd_net ? parseFloat(formData.lowest_price_usd_net) : null,
      lowest_price_eur_net: formData.lowest_price_eur_net ? parseFloat(formData.lowest_price_eur_net) : null,
      evidence_price_pln_net: formData.evidence_price_pln_net ? parseFloat(formData.evidence_price_pln_net) : null,
      evidence_price_usd_net: formData.evidence_price_usd_net ? parseFloat(formData.evidence_price_usd_net) : null,
      evidence_price_eur_net: formData.evidence_price_eur_net ? parseFloat(formData.evidence_price_eur_net) : null,
    };

    let robotPricingId: string;

    if (pricing) {
      const { error } = await supabase
        .from("robot_pricing")
        .update(pricingData)
        .eq("id", pricing.id);

      if (error) {
        toast.error("Failed to update pricing");
        setSaving(false);
        return;
      }
      robotPricingId = pricing.id;
    } else {
      const { data, error } = await supabase
        .from("robot_pricing")
        .insert([pricingData])
        .select("id")
        .single();

      if (error || !data) {
        toast.error("Failed to create pricing");
        setSaving(false);
        return;
      }
      robotPricingId = data.id;
    }

    // Handle lease pricing
    await supabase.from("lease_pricing").delete().eq("robot_pricing_id", robotPricingId);

    const leasePricingRecords = [];
    for (const [months, prices] of Object.entries(leaseFormData)) {
      if (prices.pln || prices.usd || prices.eur) {
        leasePricingRecords.push({
          robot_pricing_id: robotPricingId,
          months: parseInt(months),
          price_pln_net: prices.pln ? parseFloat(prices.pln) : 0,
          price_usd_net: prices.usd ? parseFloat(prices.usd) : 0,
          price_eur_net: prices.eur ? parseFloat(prices.eur) : 0,
        });
      }
    }

    if (leasePricingRecords.length > 0) {
      await supabase.from("lease_pricing").insert(leasePricingRecords);
    }

    toast.success("Pricing saved successfully");
    setIsEditing(false);
    setSaving(false);
    fetchPricing();
  };

  const handleCreatePricing = () => {
    setFormData({
      sale_price_pln_net: "",
      sale_price_usd_net: "",
      sale_price_eur_net: "",
      promo_price_pln_net: "",
      promo_price_usd_net: "",
      promo_price_eur_net: "",
      lowest_price_pln_net: "",
      lowest_price_usd_net: "",
      lowest_price_eur_net: "",
      evidence_price_pln_net: "",
      evidence_price_usd_net: "",
      evidence_price_eur_net: "",
    });
    setLeaseFormData({});
    setIsEditing(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-muted-foreground text-center text-sm">Loading pricing...</p>
        </CardContent>
      </Card>
    );
  }

  if (!pricing && !isEditing) {
    return (
      <Card>
      <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No pricing configured for this model.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pricing
          </CardTitle>
          {isEditing && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Tabs defaultValue="sale" className="w-full">
            <TabsList className={`grid w-full ${isAdmin ? "grid-cols-4" : "grid-cols-3"}`}>
              <TabsTrigger value="sale" className="text-xs">Sale</TabsTrigger>
              <TabsTrigger value="promo" className="text-xs">Promo</TabsTrigger>
              {isAdmin && <TabsTrigger value="evidence" className="text-xs">Evidence</TabsTrigger>}
              <TabsTrigger value="lease" className="text-xs">Lease</TabsTrigger>
            </TabsList>

            <TabsContent value="sale" className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">PLN (Net)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.sale_price_pln_net}
                    onChange={(e) => setFormData({ ...formData, sale_price_pln_net: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">EUR (Net)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.sale_price_eur_net}
                    onChange={(e) => setFormData({ ...formData, sale_price_eur_net: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">USD (Net)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.sale_price_usd_net}
                    onChange={(e) => setFormData({ ...formData, sale_price_usd_net: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="promo" className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">Optional promotional pricing</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">PLN (Net)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.promo_price_pln_net}
                    onChange={(e) => setFormData({ ...formData, promo_price_pln_net: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">EUR (Net)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.promo_price_eur_net}
                    onChange={(e) => setFormData({ ...formData, promo_price_eur_net: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">USD (Net)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.promo_price_usd_net}
                    onChange={(e) => setFormData({ ...formData, promo_price_usd_net: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="evidence" className="mt-4 space-y-3">
                <p className="text-xs text-muted-foreground">Cost/purchase price (admin-only)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">PLN (Net)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.evidence_price_pln_net}
                      onChange={(e) => setFormData({ ...formData, evidence_price_pln_net: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">EUR (Net)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.evidence_price_eur_net}
                      onChange={(e) => setFormData({ ...formData, evidence_price_eur_net: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">USD (Net)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.evidence_price_usd_net}
                      onChange={(e) => setFormData({ ...formData, evidence_price_usd_net: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>
            )}

            <TabsContent value="lease" className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">Monthly lease pricing by term</p>
              {leaseMonths.map((months) => (
                <div key={months} className="space-y-2">
                  <Label className="text-xs font-medium">{months} Months</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="PLN"
                      value={leaseFormData[months]?.pln || ""}
                      onChange={(e) =>
                        setLeaseFormData({
                          ...leaseFormData,
                          [months]: { ...leaseFormData[months], pln: e.target.value },
                        })
                      }
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="EUR"
                      value={leaseFormData[months]?.eur || ""}
                      onChange={(e) =>
                        setLeaseFormData({
                          ...leaseFormData,
                          [months]: { ...leaseFormData[months], eur: e.target.value },
                        })
                      }
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="USD"
                      value={leaseFormData[months]?.usd || ""}
                      onChange={(e) =>
                        setLeaseFormData({
                          ...leaseFormData,
                          [months]: { ...leaseFormData[months], usd: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            {/* Sale Prices */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Sale Price (Net)</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">PLN</p>
                  <p className="font-medium">{formatCurrency(pricing?.sale_price_pln_net, "PLN")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">EUR</p>
                  <p className="font-medium">{formatCurrency(pricing?.sale_price_eur_net, "EUR")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">USD</p>
                  <p className="font-medium">{formatCurrency(pricing?.sale_price_usd_net, "USD")}</p>
                </div>
              </div>
            </div>

            {/* Promo Prices */}
            {(pricing?.promo_price_pln_net || pricing?.promo_price_eur_net || pricing?.promo_price_usd_net) && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs text-muted-foreground">Promo Price (Net)</p>
                    <Badge variant="default" className="text-xs px-1.5 py-0">Active</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">PLN</p>
                      <p className="font-medium">{formatCurrency(pricing?.promo_price_pln_net, "PLN")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">EUR</p>
                      <p className="font-medium">{formatCurrency(pricing?.promo_price_eur_net, "EUR")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">USD</p>
                      <p className="font-medium">{formatCurrency(pricing?.promo_price_usd_net, "USD")}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Lease Pricing */}
            {leasePricing.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Lease Pricing (Monthly, Net)</p>
                  <div className="space-y-2">
                    {leasePricing.map((lease) => (
                      <div key={lease.id} className="grid grid-cols-4 gap-4 text-sm">
                        <div className="font-medium">{lease.months}mo</div>
                        <div>{formatCurrency(lease.price_pln_net, "PLN")}</div>
                        <div>{formatCurrency(lease.price_eur_net, "EUR")}</div>
                        <div>{formatCurrency(lease.price_usd_net, "USD")}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
