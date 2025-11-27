import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, FileText, Settings } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface ContractSettings {
  contract_number_prefix: string;
  default_payment_model: string;
  default_billing_schedule: string;
  default_terms: string;
  auto_renewal_enabled: boolean;
  auto_renewal_days_notice: string;
  default_contract_duration: string;
  require_signature: boolean;
  notification_days_before_expiry: string;
}

export const ContractsSettings = () => {
  const [settings, setSettings] = useState<ContractSettings>({
    contract_number_prefix: "CNT",
    default_payment_model: "Lease",
    default_billing_schedule: "Monthly",
    default_terms: "",
    auto_renewal_enabled: false,
    auto_renewal_days_notice: "30",
    default_contract_duration: "12",
    require_signature: true,
    notification_days_before_expiry: "30",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", [
          "contract_number_prefix",
          "default_payment_model",
          "default_billing_schedule",
          "default_terms",
          "auto_renewal_enabled",
          "auto_renewal_days_notice",
          "default_contract_duration",
          "require_signature",
          "notification_days_before_expiry",
        ]);

      if (error) throw error;

      if (data) {
        const settingsMap: any = {};
        data.forEach((item) => {
          settingsMap[item.key] = item.value;
        });
        setSettings({
          contract_number_prefix: settingsMap.contract_number_prefix || "CNT",
          default_payment_model: settingsMap.default_payment_model || "Lease",
          default_billing_schedule: settingsMap.default_billing_schedule || "Monthly",
          default_terms: settingsMap.default_terms || "",
          auto_renewal_enabled: settingsMap.auto_renewal_enabled === "true",
          auto_renewal_days_notice: settingsMap.auto_renewal_days_notice || "30",
          default_contract_duration: settingsMap.default_contract_duration || "12",
          require_signature: settingsMap.require_signature !== "false",
          notification_days_before_expiry: settingsMap.notification_days_before_expiry || "30",
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value: typeof value === "boolean" ? value.toString() : value,
      }));

      for (const setting of settingsArray) {
        const { error } = await supabase
          .from("system_settings")
          .upsert(setting, { onConflict: "key" });

        if (error) throw error;
      }

      toast.success("Contract settings saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Contract Configuration
          </CardTitle>
          <CardDescription>
            Configure default settings for contracts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contract_number_prefix">Contract Number Prefix</Label>
              <Input
                id="contract_number_prefix"
                value={settings.contract_number_prefix}
                onChange={(e) =>
                  setSettings({ ...settings, contract_number_prefix: e.target.value })
                }
                placeholder="CNT"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Example: CNT-2024-001
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_contract_duration">Default Duration (months)</Label>
              <Input
                id="default_contract_duration"
                type="number"
                min="1"
                value={settings.default_contract_duration}
                onChange={(e) =>
                  setSettings({ ...settings, default_contract_duration: e.target.value })
                }
                placeholder="12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_payment_model">Default Payment Model</Label>
              <Select
                value={settings.default_payment_model}
                onValueChange={(value) =>
                  setSettings({ ...settings, default_payment_model: value })
                }
              >
                <SelectTrigger id="default_payment_model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lease">Lease</SelectItem>
                  <SelectItem value="Purchase">Purchase</SelectItem>
                  <SelectItem value="Subscription">Subscription</SelectItem>
                  <SelectItem value="Pay-per-use">Pay-per-use</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_billing_schedule">Default Billing Schedule</Label>
              <Select
                value={settings.default_billing_schedule}
                onValueChange={(value) =>
                  setSettings({ ...settings, default_billing_schedule: value })
                }
              >
                <SelectTrigger id="default_billing_schedule">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                  <SelectItem value="One-time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification_days_before_expiry">
                Expiry Notification (days before)
              </Label>
              <Input
                id="notification_days_before_expiry"
                type="number"
                min="1"
                value={settings.notification_days_before_expiry}
                onChange={(e) =>
                  setSettings({ ...settings, notification_days_before_expiry: e.target.value })
                }
                placeholder="30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto_renewal_days_notice">
                Auto-renewal Notice (days)
              </Label>
              <Input
                id="auto_renewal_days_notice"
                type="number"
                min="1"
                value={settings.auto_renewal_days_notice}
                onChange={(e) =>
                  setSettings({ ...settings, auto_renewal_days_notice: e.target.value })
                }
                placeholder="30"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto_renewal_enabled">Enable Auto-renewal</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically renew contracts upon expiry
                </p>
              </div>
              <Switch
                id="auto_renewal_enabled"
                checked={settings.auto_renewal_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, auto_renewal_enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require_signature">Require Signature</Label>
                <p className="text-sm text-muted-foreground">
                  Contracts must be signed before activation
                </p>
              </div>
              <Switch
                id="require_signature"
                checked={settings.require_signature}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, require_signature: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Default Terms & Conditions
          </CardTitle>
          <CardDescription>
            Standard terms and conditions for new contracts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="default_terms">Terms & Conditions</Label>
            <Textarea
              id="default_terms"
              value={settings.default_terms}
              onChange={(e) =>
                setSettings({ ...settings, default_terms: e.target.value })
              }
              placeholder="Enter default terms and conditions for contracts..."
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              These terms will be pre-filled when creating new contracts
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={saveSettings} disabled={isSaving} className="w-full">
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Contract Settings"
        )}
      </Button>
    </div>
  );
};
