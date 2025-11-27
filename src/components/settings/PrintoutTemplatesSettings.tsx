import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, FileText } from "lucide-react";

interface TemplateSettings {
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_logo_url: string;
  primary_color: string;
  header_text: string;
  footer_text: string;
  terms_conditions: string;
}

export const PrintoutTemplatesSettings = () => {
  const [settings, setSettings] = useState<TemplateSettings>({
    company_name: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    company_logo_url: "",
    primary_color: "#3b82f6",
    header_text: "",
    footer_text: "",
    terms_conditions: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
          "pdf_company_name",
          "pdf_company_address",
          "pdf_company_phone",
          "pdf_company_email",
          "pdf_company_logo_url",
          "pdf_primary_color",
          "pdf_header_text",
          "pdf_footer_text",
          "pdf_terms_conditions",
        ]);

      if (error) throw error;

      if (data) {
        const settingsMap: any = {};
        data.forEach((item) => {
          const key = item.key.replace("pdf_", "");
          settingsMap[key] = item.value;
        });
        setSettings({
          company_name: settingsMap.company_name || "",
          company_address: settingsMap.company_address || "",
          company_phone: settingsMap.company_phone || "",
          company_email: settingsMap.company_email || "",
          company_logo_url: settingsMap.company_logo_url || "",
          primary_color: settingsMap.primary_color || "#3b82f6",
          header_text: settingsMap.header_text || "",
          footer_text: settingsMap.footer_text || "",
          terms_conditions: settingsMap.terms_conditions || "",
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
        key: `pdf_${key}`,
        value: value,
      }));

      for (const setting of settingsArray) {
        const { error } = await supabase
          .from("system_settings")
          .upsert(setting, { onConflict: "key" });

        if (error) throw error;
      }

      toast.success("Template settings saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `company-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("offer-pdfs")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("offer-pdfs")
        .getPublicUrl(filePath);

      setSettings({ ...settings, company_logo_url: data.publicUrl });
      toast.success("Logo uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload logo");
    } finally {
      setIsUploading(false);
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
            <FileText className="h-5 w-5" />
            Company Information
          </CardTitle>
          <CardDescription>
            Configure company details for PDF printouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={settings.company_name}
                onChange={(e) =>
                  setSettings({ ...settings, company_name: e.target.value })
                }
                placeholder="Your Company Ltd."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_email">Company Email</Label>
              <Input
                id="company_email"
                type="email"
                value={settings.company_email}
                onChange={(e) =>
                  setSettings({ ...settings, company_email: e.target.value })
                }
                placeholder="contact@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_phone">Company Phone</Label>
              <Input
                id="company_phone"
                value={settings.company_phone}
                onChange={(e) =>
                  setSettings({ ...settings, company_phone: e.target.value })
                }
                placeholder="+1 234 567 890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) =>
                    setSettings({ ...settings, primary_color: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) =>
                    setSettings({ ...settings, primary_color: e.target.value })
                  }
                  placeholder="#3b82f6"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_address">Company Address</Label>
            <Textarea
              id="company_address"
              value={settings.company_address}
              onChange={(e) =>
                setSettings({ ...settings, company_address: e.target.value })
              }
              placeholder="123 Business St, City, Country"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_logo">Company Logo</Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                onClick={() => document.getElementById("logo-upload")?.click()}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </>
                )}
              </Button>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              {settings.company_logo_url && (
                <img
                  src={settings.company_logo_url}
                  alt="Company logo"
                  className="h-12 object-contain"
                />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Upload a PNG or JPG image (max 2MB)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>PDF Content</CardTitle>
          <CardDescription>
            Customize header, footer and terms text
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="header_text">Header Text</Label>
            <Input
              id="header_text"
              value={settings.header_text}
              onChange={(e) =>
                setSettings({ ...settings, header_text: e.target.value })
              }
              placeholder="Official Commercial Offer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer_text">Footer Text</Label>
            <Input
              id="footer_text"
              value={settings.footer_text}
              onChange={(e) =>
                setSettings({ ...settings, footer_text: e.target.value })
              }
              placeholder="Thank you for your business"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms_conditions">Terms & Conditions</Label>
            <Textarea
              id="terms_conditions"
              value={settings.terms_conditions}
              onChange={(e) =>
                setSettings({ ...settings, terms_conditions: e.target.value })
              }
              placeholder="Enter your standard terms and conditions..."
              rows={6}
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
          "Save Template Settings"
        )}
      </Button>
    </div>
  );
};
