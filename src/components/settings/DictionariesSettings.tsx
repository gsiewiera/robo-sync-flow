import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Dictionary = {
  robot_types: string[];
  client_types: string[];
  markets: string[];
  segments: string[];
  contract_types: string[];
  service_types: string[];
  payment_models: string[];
  billing_schedules: string[];
  priorities: string[];
  countries: string[];
  lease_months: string[];
  manufacturers: string[];
};

type DictionaryIds = {
  client_types: { id: string; name: string }[];
  markets: { id: string; name: string }[];
  segments: { id: string; name: string }[];
};

type NumericSettings = {
  km_rate: number;
};

const categories = [
  { key: "km_rate", label: "Travel Cost (per km)", type: "numeric" },
  { key: "robot_types", label: "Robot Types", type: "list" },
  { key: "manufacturers", label: "Manufacturers", type: "list" },
  { key: "client_types", label: "Client Types", type: "list" },
  { key: "markets", label: "Markets", type: "list" },
  { key: "segments", label: "Segments", type: "list" },
  { key: "contract_types", label: "Contract Types", type: "list" },
  { key: "service_types", label: "Service Types", type: "list" },
  { key: "payment_models", label: "Payment Models", type: "list" },
  { key: "billing_schedules", label: "Billing Schedules", type: "list" },
  { key: "priorities", label: "Priorities", type: "list" },
  { key: "countries", label: "Countries", type: "list" },
  { key: "lease_months", label: "Lease Months", type: "list" },
] as const;

export const DictionariesSettings = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("km_rate");
  const [dictionaries, setDictionaries] = useState<Dictionary>({
    robot_types: [],
    manufacturers: [],
    client_types: [],
    markets: [],
    segments: [],
    contract_types: ["Service Agreement", "Maintenance Contract", "Full Support", "On-Demand"],
    service_types: ["Preventive Maintenance", "Repair", "Upgrade", "Training", "Consultation"],
    payment_models: ["Lease", "Purchase", "Subscription", "Pay-per-use"],
    billing_schedules: ["Monthly", "Quarterly", "Annual", "One-time"],
    priorities: ["low", "medium", "high", "critical"],
    countries: ["Poland", "Germany", "Czech Republic", "Slovakia"],
    lease_months: ["6", "12", "24", "36", "48"],
  });
  const [dictionaryIds, setDictionaryIds] = useState<DictionaryIds>({
    client_types: [],
    markets: [],
    segments: [],
  });
  const [numericSettings, setNumericSettings] = useState<NumericSettings>({
    km_rate: 1.50,
  });

  useEffect(() => {
    checkAdminRole();
    fetchManufacturers();
    fetchRobotTypes();
    fetchNumericSettings();
    fetchClientTypes();
    fetchMarkets();
    fetchSegments();
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

  const fetchManufacturers = async () => {
    const { data, error } = await supabase
      .from("manufacturer_dictionary")
      .select("manufacturer_name")
      .order("manufacturer_name");

    if (!error && data) {
      setDictionaries((prev) => ({
        ...prev,
        manufacturers: data.map((m) => m.manufacturer_name),
      }));
    }
  };

  const fetchRobotTypes = async () => {
    const { data, error } = await supabase
      .from("robot_type_dictionary")
      .select("type_name")
      .order("type_name");

    if (!error && data) {
      setDictionaries((prev) => ({
        ...prev,
        robot_types: data.map((t) => t.type_name),
      }));
    }
  };

  const fetchClientTypes = async () => {
    const { data, error } = await supabase
      .from("client_type_dictionary")
      .select("id, name")
      .order("name");

    if (!error && data) {
      setDictionaries((prev) => ({
        ...prev,
        client_types: data.map((t) => t.name),
      }));
      setDictionaryIds((prev) => ({
        ...prev,
        client_types: data,
      }));
    }
  };

  const fetchMarkets = async () => {
    const { data, error } = await supabase
      .from("market_dictionary")
      .select("id, name")
      .order("name");

    if (!error && data) {
      setDictionaries((prev) => ({
        ...prev,
        markets: data.map((m) => m.name),
      }));
      setDictionaryIds((prev) => ({
        ...prev,
        markets: data,
      }));
    }
  };

  const fetchSegments = async () => {
    const { data, error } = await supabase
      .from("segment_dictionary")
      .select("id, name")
      .order("name");

    if (!error && data) {
      setDictionaries((prev) => ({
        ...prev,
        segments: data.map((s) => s.name),
      }));
      setDictionaryIds((prev) => ({
        ...prev,
        segments: data,
      }));
    }
  };

  const fetchNumericSettings = async () => {
    const { data, error } = await supabase
      .from("system_numeric_settings")
      .select("setting_key, setting_value");

    if (!error && data) {
      const settings: Partial<NumericSettings> = {};
      data.forEach((row) => {
        if (row.setting_key === "km_rate") {
          settings.km_rate = Number(row.setting_value);
        }
      });
      setNumericSettings((prev) => ({ ...prev, ...settings }));
    }
  };

  const updateNumericSetting = async (key: keyof NumericSettings, value: number) => {
    const { error } = await supabase
      .from("system_numeric_settings")
      .update({ setting_value: value, updated_at: new Date().toISOString() })
      .eq("setting_key", key);

    if (error) {
      console.error("Error updating setting:", error);
      toast.error("Failed to update setting");
      return;
    }
    
    setNumericSettings((prev) => ({ ...prev, [key]: value }));
    toast.success("Setting updated successfully");
  };

  const addItem = async (category: keyof Dictionary, value: string) => {
    if (!value.trim()) return;

    // Handle manufacturers with database
    if (category === "manufacturers") {
      const { error } = await supabase
        .from("manufacturer_dictionary")
        .insert({ manufacturer_name: value.trim() });

      if (error) {
        console.error("Error adding manufacturer:", error);
        toast.error("Failed to add manufacturer");
        return;
      }
      await fetchManufacturers();
      toast.success("Manufacturer added successfully");
      return;
    }

    // Handle robot types with database
    if (category === "robot_types") {
      const { error } = await supabase
        .from("robot_type_dictionary")
        .insert({ type_name: value.trim() });

      if (error) {
        console.error("Error adding robot type:", error);
        toast.error("Failed to add robot type");
        return;
      }
      await fetchRobotTypes();
      toast.success("Robot type added successfully");
      return;
    }

    // Handle client types with database
    if (category === "client_types") {
      const { error } = await supabase
        .from("client_type_dictionary")
        .insert({ name: value.trim() });

      if (error) {
        console.error("Error adding client type:", error);
        toast.error("Failed to add client type");
        return;
      }
      await fetchClientTypes();
      toast.success("Client type added successfully");
      return;
    }

    // Handle markets with database
    if (category === "markets") {
      const { error } = await supabase
        .from("market_dictionary")
        .insert({ name: value.trim() });

      if (error) {
        console.error("Error adding market:", error);
        toast.error("Failed to add market");
        return;
      }
      await fetchMarkets();
      toast.success("Market added successfully");
      return;
    }

    // Handle segments with database
    if (category === "segments") {
      const { error } = await supabase
        .from("segment_dictionary")
        .insert({ name: value.trim() });

      if (error) {
        console.error("Error adding segment:", error);
        toast.error("Failed to add segment");
        return;
      }
      await fetchSegments();
      toast.success("Segment added successfully");
      return;
    }

    // Handle other categories (client-side only for now)
    setDictionaries((prev) => ({
      ...prev,
      [category]: [...prev[category], value.trim()],
    }));
  };

  const removeItem = async (category: keyof Dictionary, index: number) => {
    // Handle manufacturers with database
    if (category === "manufacturers") {
      const manufacturerName = dictionaries.manufacturers[index];
      const { error } = await supabase
        .from("manufacturer_dictionary")
        .delete()
        .eq("manufacturer_name", manufacturerName);

      if (error) {
        console.error("Error removing manufacturer:", error);
        toast.error("Failed to remove manufacturer");
        return;
      }
      await fetchManufacturers();
      toast.success("Manufacturer removed successfully");
      return;
    }

    // Handle robot types with database
    if (category === "robot_types") {
      const typeName = dictionaries.robot_types[index];
      const { error } = await supabase
        .from("robot_type_dictionary")
        .delete()
        .eq("type_name", typeName);

      if (error) {
        console.error("Error removing robot type:", error);
        toast.error("Failed to remove robot type");
        return;
      }
      await fetchRobotTypes();
      toast.success("Robot type removed successfully");
      return;
    }

    // Handle client types with database
    if (category === "client_types") {
      const item = dictionaryIds.client_types[index];
      if (!item) return;
      const { error } = await supabase
        .from("client_type_dictionary")
        .delete()
        .eq("id", item.id);

      if (error) {
        console.error("Error removing client type:", error);
        toast.error("Failed to remove client type");
        return;
      }
      await fetchClientTypes();
      toast.success("Client type removed successfully");
      return;
    }

    // Handle markets with database
    if (category === "markets") {
      const item = dictionaryIds.markets[index];
      if (!item) return;
      const { error } = await supabase
        .from("market_dictionary")
        .delete()
        .eq("id", item.id);

      if (error) {
        console.error("Error removing market:", error);
        toast.error("Failed to remove market");
        return;
      }
      await fetchMarkets();
      toast.success("Market removed successfully");
      return;
    }

    // Handle segments with database
    if (category === "segments") {
      const item = dictionaryIds.segments[index];
      if (!item) return;
      const { error } = await supabase
        .from("segment_dictionary")
        .delete()
        .eq("id", item.id);

      if (error) {
        console.error("Error removing segment:", error);
        toast.error("Failed to remove segment");
        return;
      }
      await fetchSegments();
      toast.success("Segment removed successfully");
      return;
    }

    // Handle other categories (client-side only for now)
    setDictionaries((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  const NumericSettingEditor = ({ settingKey }: { settingKey: keyof NumericSettings }) => {
    const [value, setValue] = useState(numericSettings[settingKey].toString());
    const currentCategory = categories.find(c => c.key === settingKey);

    const handleSave = () => {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        toast.error("Please enter a valid positive number");
        return;
      }
      updateNumericSetting(settingKey, numValue);
    };

    return (
      <div className="space-y-6">
        <div>
          <Label className="text-lg font-semibold">{currentCategory?.label}</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Set the cost per kilometer for travel calculations
          </p>
        </div>

        <div className="flex gap-2 items-center max-w-md">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={!isAdmin}
            className="flex-1"
            placeholder="Enter rate per km"
          />
          <span className="text-muted-foreground">PLN/km</span>
          <Button onClick={handleSave} disabled={!isAdmin}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Current rate: <span className="font-medium">{numericSettings[settingKey].toFixed(2)} PLN</span> per kilometer
        </p>
      </div>
    );
  };

  const DictionaryEditor = () => {
    const [newValue, setNewValue] = useState("");
    const currentCategory = categories.find(c => c.key === activeCategory);

    if (currentCategory?.type === "numeric") {
      return <NumericSettingEditor settingKey={activeCategory as keyof NumericSettings} />;
    }

    const dictionaryKey = activeCategory as keyof Dictionary;

    return (
      <div className="space-y-6">
        <div>
          <Label className="text-lg font-semibold">{currentCategory?.label}</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Manage {currentCategory?.label.toLowerCase()} options
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder={`Add new ${currentCategory?.label.toLowerCase()}`}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                addItem(dictionaryKey, newValue);
                setNewValue("");
              }
            }}
            disabled={!isAdmin}
            className="flex-1"
          />
          <Button
            onClick={() => {
              addItem(dictionaryKey, newValue);
              setNewValue("");
            }}
            disabled={!isAdmin}
          >
            Add
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {dictionaries[dictionaryKey]?.map((item, index) => (
            <Badge key={index} variant="secondary" className="gap-2 py-2 px-3 text-sm">
              {item}
              {isAdmin && (
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeItem(dictionaryKey, index)}
                />
              )}
            </Badge>
          ))}
        </div>
      </div>
    );
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
          <CardTitle>Dictionaries</CardTitle>
          <CardDescription>Manage system reference data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Only administrators can manage dictionaries. Contact your system administrator for access.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dictionaries</CardTitle>
        <CardDescription>Manage system reference data and lookup values</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row min-h-[500px]">
          {/* Sidebar */}
          <div className="w-full md:w-64 border-r border-border">
            <ScrollArea className="h-[500px]">
              <div className="p-4 space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.key}
                    onClick={() => setActiveCategory(category.key as keyof Dictionary)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      activeCategory === category.key
                        ? "bg-accent text-accent-foreground font-medium"
                        : "hover:bg-accent/50 text-muted-foreground"
                    )}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6">
            <DictionaryEditor />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
