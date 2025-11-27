import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, FileText, Settings, Plus, Check, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ContractSettings {
  contract_number_prefix: string;
  require_signature: boolean;
  notification_days_before_expiry: string;
  // Purchase-specific
  purchase_payment_terms: string;
  purchase_warranty_period: string;
  purchase_delivery_terms: string;
  purchase_default_terms: string;
  // Lease-specific
  lease_default_duration: string;
  lease_billing_schedule: string;
  lease_auto_renewal_enabled: boolean;
  lease_auto_renewal_days_notice: string;
  lease_security_deposit_required: boolean;
  lease_early_termination_fee: string;
  lease_default_terms: string;
}

interface ContractTemplate {
  id: string;
  template_name: string;
  contract_type: "purchase" | "lease";
  template_content: string;
  is_active: boolean;
  created_at: string;
}

interface NewTemplate {
  template_name: string;
  template_content: string;
}

export const ContractsSettings = () => {
  const [settings, setSettings] = useState<ContractSettings>({
    contract_number_prefix: "CNT",
    require_signature: true,
    notification_days_before_expiry: "30",
    // Purchase
    purchase_payment_terms: "Net 30",
    purchase_warranty_period: "12",
    purchase_delivery_terms: "",
    purchase_default_terms: "",
    // Lease
    lease_default_duration: "12",
    lease_billing_schedule: "Monthly",
    lease_auto_renewal_enabled: false,
    lease_auto_renewal_days_notice: "30",
    lease_security_deposit_required: false,
    lease_early_termination_fee: "0",
    lease_default_terms: "",
  });
  const [purchaseTemplates, setPurchaseTemplates] = useState<ContractTemplate[]>([]);
  const [leaseTemplates, setLeaseTemplates] = useState<ContractTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTemplateType, setCurrentTemplateType] = useState<"purchase" | "lease">("purchase");
  const [newTemplate, setNewTemplate] = useState<NewTemplate>({
    template_name: "",
    template_content: "",
  });

  useEffect(() => {
    fetchSettings();
    fetchTemplates();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", [
          "contract_number_prefix",
          "require_signature",
          "notification_days_before_expiry",
          "purchase_payment_terms",
          "purchase_warranty_period",
          "purchase_delivery_terms",
          "purchase_default_terms",
          "lease_default_duration",
          "lease_billing_schedule",
          "lease_auto_renewal_enabled",
          "lease_auto_renewal_days_notice",
          "lease_security_deposit_required",
          "lease_early_termination_fee",
          "lease_default_terms",
        ]);

      if (error) throw error;

      if (data) {
        const settingsMap: any = {};
        data.forEach((item) => {
          settingsMap[item.key] = item.value;
        });
        setSettings({
          contract_number_prefix: settingsMap.contract_number_prefix || "CNT",
          require_signature: settingsMap.require_signature !== "false",
          notification_days_before_expiry: settingsMap.notification_days_before_expiry || "30",
          purchase_payment_terms: settingsMap.purchase_payment_terms || "Net 30",
          purchase_warranty_period: settingsMap.purchase_warranty_period || "12",
          purchase_delivery_terms: settingsMap.purchase_delivery_terms || "",
          purchase_default_terms: settingsMap.purchase_default_terms || "",
          lease_default_duration: settingsMap.lease_default_duration || "12",
          lease_billing_schedule: settingsMap.lease_billing_schedule || "Monthly",
          lease_auto_renewal_enabled: settingsMap.lease_auto_renewal_enabled === "true",
          lease_auto_renewal_days_notice: settingsMap.lease_auto_renewal_days_notice || "30",
          lease_security_deposit_required: settingsMap.lease_security_deposit_required === "true",
          lease_early_termination_fee: settingsMap.lease_early_termination_fee || "0",
          lease_default_terms: settingsMap.lease_default_terms || "",
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setPurchaseTemplates(
          data.filter((t) => t.contract_type === "purchase") as ContractTemplate[]
        );
        setLeaseTemplates(
          data.filter((t) => t.contract_type === "lease") as ContractTemplate[]
        );
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load templates");
    }
  };

  const createTemplate = async () => {
    if (!newTemplate.template_name.trim() || !newTemplate.template_content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("contract_templates")
        .insert({
          template_name: newTemplate.template_name.trim(),
          contract_type: currentTemplateType,
          template_content: newTemplate.template_content.trim(),
          created_by: user?.id,
        });

      if (error) throw error;

      toast.success("Template created successfully");
      setIsDialogOpen(false);
      setNewTemplate({ template_name: "", template_content: "" });
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.message || "Failed to create template");
    }
  };

  const activateTemplate = async (templateId: string, type: "purchase" | "lease") => {
    try {
      const { error } = await supabase
        .from("contract_templates")
        .update({ is_active: true })
        .eq("id", templateId);

      if (error) throw error;

      toast.success("Template activated");
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.message || "Failed to activate template");
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from("contract_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;

      toast.success("Template deleted");
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete template");
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

  const TemplateList = ({ templates, type }: { templates: ContractTemplate[]; type: "purchase" | "lease" }) => {
    const activeTemplate = templates.find((t) => t.is_active);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold capitalize">{type} Contracts</h3>
            <p className="text-sm text-muted-foreground">
              Manage templates for {type} contracts
            </p>
          </div>
          <Dialog open={isDialogOpen && currentTemplateType === type} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (open) setCurrentTemplateType(type);
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create {type} Contract Template</DialogTitle>
                <DialogDescription>
                  Add a new template for {type} contracts
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="template_name">Template Name</Label>
                  <Input
                    id="template_name"
                    value={newTemplate.template_name}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, template_name: e.target.value })
                    }
                    placeholder="e.g., Standard Purchase Agreement"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template_content">Template Content</Label>
                  <Textarea
                    id="template_content"
                    value={newTemplate.template_content}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, template_content: e.target.value })
                    }
                    placeholder="Enter the contract template content..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createTemplate}>Create Template</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No templates yet. Create your first {type} contract template.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <Card key={template.id} className={template.is_active ? "ring-2 ring-primary" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{template.template_name}</CardTitle>
                        {template.is_active && (
                          <Badge variant="default" className="gap-1">
                            <Check className="h-3 w-3" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs">
                        Created {new Date(template.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {!template.is_active && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => activateTemplate(template.id, type)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Activate
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Template</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this template? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteTemplate(template.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-md p-3 max-h-32 overflow-y-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {template.template_content}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
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
            <FileText className="h-5 w-5" />
            Contract Templates
          </CardTitle>
          <CardDescription>
            Manage contract templates for purchase and lease agreements. Only one template can be active per type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="purchase" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="purchase">Purchase Contracts</TabsTrigger>
              <TabsTrigger value="lease">Lease Contracts</TabsTrigger>
            </TabsList>
            <TabsContent value="purchase" className="mt-6">
              <TemplateList templates={purchaseTemplates} type="purchase" />
            </TabsContent>
            <TabsContent value="lease" className="mt-6">
              <TemplateList templates={leaseTemplates} type="lease" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Global contract configuration
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
          </div>

          <div className="pt-4 border-t">
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
          <CardTitle>Purchase Contract Settings</CardTitle>
          <CardDescription>
            Default configuration for purchase contracts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="purchase_payment_terms">Payment Terms</Label>
              <Select
                value={settings.purchase_payment_terms}
                onValueChange={(value) =>
                  setSettings({ ...settings, purchase_payment_terms: value })
                }
              >
                <SelectTrigger id="purchase_payment_terms">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Net 15">Net 15</SelectItem>
                  <SelectItem value="Net 30">Net 30</SelectItem>
                  <SelectItem value="Net 60">Net 60</SelectItem>
                  <SelectItem value="Net 90">Net 90</SelectItem>
                  <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                  <SelectItem value="50% Deposit">50% Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_warranty_period">Warranty Period (months)</Label>
              <Input
                id="purchase_warranty_period"
                type="number"
                min="0"
                value={settings.purchase_warranty_period}
                onChange={(e) =>
                  setSettings({ ...settings, purchase_warranty_period: e.target.value })
                }
                placeholder="12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase_delivery_terms">Delivery Terms</Label>
            <Textarea
              id="purchase_delivery_terms"
              value={settings.purchase_delivery_terms}
              onChange={(e) =>
                setSettings({ ...settings, purchase_delivery_terms: e.target.value })
              }
              placeholder="e.g., FOB shipping point, delivery within 30 days..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase_default_terms">Default Terms & Conditions</Label>
            <Textarea
              id="purchase_default_terms"
              value={settings.purchase_default_terms}
              onChange={(e) =>
                setSettings({ ...settings, purchase_default_terms: e.target.value })
              }
              placeholder="Enter default terms for purchase contracts..."
              rows={6}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lease Contract Settings</CardTitle>
          <CardDescription>
            Default configuration for lease contracts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lease_default_duration">Default Duration (months)</Label>
              <Input
                id="lease_default_duration"
                type="number"
                min="1"
                value={settings.lease_default_duration}
                onChange={(e) =>
                  setSettings({ ...settings, lease_default_duration: e.target.value })
                }
                placeholder="12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lease_billing_schedule">Billing Schedule</Label>
              <Select
                value={settings.lease_billing_schedule}
                onValueChange={(value) =>
                  setSettings({ ...settings, lease_billing_schedule: value })
                }
              >
                <SelectTrigger id="lease_billing_schedule">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lease_auto_renewal_days_notice">
                Auto-renewal Notice (days)
              </Label>
              <Input
                id="lease_auto_renewal_days_notice"
                type="number"
                min="1"
                value={settings.lease_auto_renewal_days_notice}
                onChange={(e) =>
                  setSettings({ ...settings, lease_auto_renewal_days_notice: e.target.value })
                }
                placeholder="30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lease_early_termination_fee">
                Early Termination Fee (%)
              </Label>
              <Input
                id="lease_early_termination_fee"
                type="number"
                min="0"
                max="100"
                value={settings.lease_early_termination_fee}
                onChange={(e) =>
                  setSettings({ ...settings, lease_early_termination_fee: e.target.value })
                }
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="lease_auto_renewal_enabled">Enable Auto-renewal</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically renew lease contracts upon expiry
                </p>
              </div>
              <Switch
                id="lease_auto_renewal_enabled"
                checked={settings.lease_auto_renewal_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, lease_auto_renewal_enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="lease_security_deposit_required">
                  Require Security Deposit
                </Label>
                <p className="text-sm text-muted-foreground">
                  Security deposit required for new leases
                </p>
              </div>
              <Switch
                id="lease_security_deposit_required"
                checked={settings.lease_security_deposit_required}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, lease_security_deposit_required: checked })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lease_default_terms">Default Terms & Conditions</Label>
            <Textarea
              id="lease_default_terms"
              value={settings.lease_default_terms}
              onChange={(e) =>
                setSettings({ ...settings, lease_default_terms: e.target.value })
              }
              placeholder="Enter default terms for lease contracts..."
              rows={6}
              className="font-mono text-sm"
            />
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
          "Save General Settings"
        )}
      </Button>
    </div>
  );
};
