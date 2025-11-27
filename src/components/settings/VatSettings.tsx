import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const VatSettings = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vatRate, setVatRate] = useState("23");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminRole();
    fetchVatRate();
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
    setLoading(false);
  };

  const fetchVatRate = async () => {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "vat_rate")
      .single();

    if (!error && data) {
      setVatRate(data.value);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase
      .from("system_settings")
      .update({ value: vatRate })
      .eq("key", "vat_rate");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update VAT rate",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "VAT rate updated successfully",
      });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>VAT Settings</CardTitle>
          <CardDescription>Manage VAT rate for pricing calculations</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Only administrators can manage VAT settings. Contact your system administrator for access.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>VAT Settings</CardTitle>
        <CardDescription>Configure the VAT rate used for pricing calculations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vat-rate">VAT Rate (%)</Label>
          <Input
            id="vat-rate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value)}
            placeholder="23"
          />
          <p className="text-sm text-muted-foreground">
            Current VAT rate: {vatRate}%
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save VAT Rate"}
        </Button>
      </CardContent>
    </Card>
  );
};
