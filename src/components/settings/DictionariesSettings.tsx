import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Save, Pencil, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Dictionary = {
  robot_types: string[];
  robot_statuses: string[];
  client_types: string[];
  markets: string[];
  segments: string[];
  client_sizes: string[];
  contract_types: string[];
  service_types: string[];
  payment_models: string[];
  billing_schedules: string[];
  priorities: string[];
  countries: string[];
  lease_months: string[];
  manufacturers: string[];
};

type ClientTag = {
  id: string;
  name: string;
  color: string | null;
};

type RobotStatus = {
  id: string;
  name: string;
  color: string | null;
};

type DictionaryIds = {
  client_types: { id: string; name: string }[];
  markets: { id: string; name: string }[];
  segments: { id: string; name: string }[];
  client_sizes: { id: string; name: string }[];
};

type NumericSettings = {
  km_rate: number;
};

type TextSettings = {
  contract_number_mask: string;
};

const categories = [
  { key: "km_rate", label: "Travel Cost (per km)", type: "numeric" },
  { key: "contract_number_mask", label: "Contract Number Mask", type: "text_setting" },
  { key: "client_tags", label: "Client Tags", type: "tags" },
  { key: "robot_types", label: "Robot Types", type: "list" },
  { key: "robot_statuses", label: "Robot Statuses", type: "statuses" },
  { key: "manufacturers", label: "Manufacturers", type: "list" },
  { key: "client_types", label: "Client Types", type: "list" },
  { key: "client_sizes", label: "Client Sizes", type: "list" },
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
    robot_statuses: [],
    manufacturers: [],
    client_types: [],
    markets: [],
    segments: [],
    client_sizes: [],
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
    client_sizes: [],
  });
  const [numericSettings, setNumericSettings] = useState<NumericSettings>({
    km_rate: 1.50,
  });
  const [textSettings, setTextSettings] = useState<TextSettings>({
    contract_number_mask: "CNT-{YYYY}-{NNN}",
  });
  const [clientTags, setClientTags] = useState<ClientTag[]>([]);
  const [robotStatuses, setRobotStatuses] = useState<RobotStatus[]>([]);

  useEffect(() => {
    checkAdminRole();
    fetchManufacturers();
    fetchRobotTypes();
    fetchRobotStatuses();
    fetchNumericSettings();
    fetchTextSettings();
    fetchClientTypes();
    fetchMarkets();
    fetchSegments();
    fetchClientSizes();
    fetchClientTags();
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

  const fetchRobotStatuses = async () => {
    const { data, error } = await supabase
      .from("robot_status_dictionary")
      .select("id, name, color")
      .order("name");

    if (!error && data) {
      setDictionaries((prev) => ({
        ...prev,
        robot_statuses: data.map((s) => s.name),
      }));
      setRobotStatuses(data);
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

  const fetchClientSizes = async () => {
    const { data, error } = await supabase
      .from("client_size_dictionary")
      .select("id, name")
      .order("name");

    if (!error && data) {
      setDictionaries((prev) => ({
        ...prev,
        client_sizes: data.map((s) => s.name),
      }));
      setDictionaryIds((prev) => ({
        ...prev,
        client_sizes: data,
      }));
    }
  };

  const fetchClientTags = async () => {
    const { data, error } = await supabase
      .from("client_tags")
      .select("id, name, color")
      .order("name");

    if (!error && data) {
      setClientTags(data);
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

  const fetchTextSettings = async () => {
    const { data, error } = await supabase
      .from("system_text_settings")
      .select("setting_key, setting_value");

    if (!error && data) {
      const settings: Partial<TextSettings> = {};
      data.forEach((row) => {
        if (row.setting_key === "contract_number_mask") {
          settings.contract_number_mask = row.setting_value;
        }
      });
      setTextSettings((prev) => ({ ...prev, ...settings }));
    }
  };

  const updateTextSetting = async (key: keyof TextSettings, value: string) => {
    const { error } = await supabase
      .from("system_text_settings")
      .update({ setting_value: value, updated_at: new Date().toISOString() })
      .eq("setting_key", key);

    if (error) {
      console.error("Error updating setting:", error);
      toast.error("Failed to update setting");
      return;
    }
    
    setTextSettings((prev) => ({ ...prev, [key]: value }));
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

    // Handle robot statuses with database
    if (category === "robot_statuses") {
      const { error } = await supabase
        .from("robot_status_dictionary")
        .insert({ name: value.trim() });

      if (error) {
        console.error("Error adding robot status:", error);
        toast.error("Failed to add robot status");
        return;
      }
      await fetchRobotStatuses();
      toast.success("Robot status added successfully");
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

    // Handle client sizes with database
    if (category === "client_sizes") {
      const { error } = await supabase
        .from("client_size_dictionary")
        .insert({ name: value.trim() });

      if (error) {
        console.error("Error adding client size:", error);
        toast.error("Failed to add client size");
        return;
      }
      await fetchClientSizes();
      toast.success("Client size added successfully");
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

    // Handle robot statuses with database
    if (category === "robot_statuses") {
      const statusName = dictionaries.robot_statuses[index];
      const { error } = await supabase
        .from("robot_status_dictionary")
        .delete()
        .eq("name", statusName);

      if (error) {
        console.error("Error removing robot status:", error);
        toast.error("Failed to remove robot status");
        return;
      }
      await fetchRobotStatuses();
      toast.success("Robot status removed successfully");
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

    // Handle client sizes with database
    if (category === "client_sizes") {
      const item = dictionaryIds.client_sizes[index];
      if (!item) return;
      const { error } = await supabase
        .from("client_size_dictionary")
        .delete()
        .eq("id", item.id);

      if (error) {
        console.error("Error removing client size:", error);
        toast.error("Failed to remove client size");
        return;
      }
      await fetchClientSizes();
      toast.success("Client size removed successfully");
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

  const TagEditor = () => {
    const [newTagName, setNewTagName] = useState("");
    const [newTagColor, setNewTagColor] = useState("#10b981");
    const [editingTag, setEditingTag] = useState<ClientTag | null>(null);
    const [editName, setEditName] = useState("");
    const [editColor, setEditColor] = useState("");

    const addTag = async () => {
      if (!newTagName.trim()) return;

      const { error } = await supabase
        .from("client_tags")
        .insert({ name: newTagName.trim(), color: newTagColor });

      if (error) {
        console.error("Error adding tag:", error);
        toast.error("Failed to add tag");
        return;
      }
      await fetchClientTags();
      setNewTagName("");
      setNewTagColor("#10b981");
      toast.success("Tag added successfully");
    };

    const updateTag = async () => {
      if (!editingTag || !editName.trim()) return;

      const { error } = await supabase
        .from("client_tags")
        .update({ name: editName.trim(), color: editColor })
        .eq("id", editingTag.id);

      if (error) {
        console.error("Error updating tag:", error);
        toast.error("Failed to update tag");
        return;
      }
      await fetchClientTags();
      setEditingTag(null);
      toast.success("Tag updated successfully");
    };

    const removeTag = async (tagId: string) => {
      const { error } = await supabase
        .from("client_tags")
        .delete()
        .eq("id", tagId);

      if (error) {
        console.error("Error removing tag:", error);
        toast.error("Failed to remove tag");
        return;
      }
      await fetchClientTags();
      toast.success("Tag removed successfully");
    };

    const startEditing = (tag: ClientTag) => {
      setEditingTag(tag);
      setEditName(tag.name);
      setEditColor(tag.color || "#10b981");
    };

    return (
      <div className="space-y-6">
        <div>
          <Label className="text-lg font-semibold">Client Tags</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Manage tags that can be assigned to clients
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <Input
            placeholder="Tag name"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                addTag();
              }
            }}
            disabled={!isAdmin}
            className="flex-1"
          />
          <input
            type="color"
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            disabled={!isAdmin}
            className="w-10 h-10 rounded border border-border cursor-pointer"
          />
          <Button onClick={addTag} disabled={!isAdmin}>
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {clientTags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-2">
              {editingTag?.id === tag.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") updateTag();
                    }}
                  />
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-10 h-10 rounded border border-border cursor-pointer"
                  />
                  <Button size="sm" onClick={updateTag}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingTag(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Badge
                    variant="secondary"
                    className="py-2 px-3 text-sm flex-1 justify-start"
                    style={{ backgroundColor: tag.color || "#10b981", color: "#fff" }}
                  >
                    {tag.name}
                  </Badge>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(tag)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTag(tag.id)}
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {clientTags.length === 0 && (
            <p className="text-sm text-muted-foreground">No tags defined yet</p>
          )}
        </div>
      </div>
    );
  };

  const StatusEditor = () => {
    const [newStatusName, setNewStatusName] = useState("");
    const [newStatusColor, setNewStatusColor] = useState("#6b7280");
    const [editingStatus, setEditingStatus] = useState<RobotStatus | null>(null);
    const [editName, setEditName] = useState("");
    const [editColor, setEditColor] = useState("");

    const addStatus = async () => {
      if (!newStatusName.trim()) return;

      const { error } = await supabase
        .from("robot_status_dictionary")
        .insert({ name: newStatusName.trim(), color: newStatusColor });

      if (error) {
        console.error("Error adding status:", error);
        toast.error("Failed to add status");
        return;
      }
      await fetchRobotStatuses();
      setNewStatusName("");
      setNewStatusColor("#6b7280");
      toast.success("Status added successfully");
    };

    const updateStatus = async () => {
      if (!editingStatus || !editName.trim()) return;

      const { error } = await supabase
        .from("robot_status_dictionary")
        .update({ name: editName.trim(), color: editColor })
        .eq("id", editingStatus.id);

      if (error) {
        console.error("Error updating status:", error);
        toast.error("Failed to update status");
        return;
      }
      await fetchRobotStatuses();
      setEditingStatus(null);
      toast.success("Status updated successfully");
    };

    const removeStatus = async (statusId: string) => {
      const { error } = await supabase
        .from("robot_status_dictionary")
        .delete()
        .eq("id", statusId);

      if (error) {
        console.error("Error removing status:", error);
        toast.error("Failed to remove status");
        return;
      }
      await fetchRobotStatuses();
      toast.success("Status removed successfully");
    };

    const startEditing = (status: RobotStatus) => {
      setEditingStatus(status);
      setEditName(status.name);
      setEditColor(status.color || "#6b7280");
    };

    return (
      <div className="space-y-6">
        <div>
          <Label className="text-lg font-semibold">Robot Statuses</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Manage statuses and their colors for robots
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <Input
            placeholder="Status name"
            value={newStatusName}
            onChange={(e) => setNewStatusName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                addStatus();
              }
            }}
            disabled={!isAdmin}
            className="flex-1"
          />
          <input
            type="color"
            value={newStatusColor}
            onChange={(e) => setNewStatusColor(e.target.value)}
            disabled={!isAdmin}
            className="w-10 h-10 rounded border border-border cursor-pointer"
          />
          <Button onClick={addStatus} disabled={!isAdmin}>
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {robotStatuses.map((status) => (
            <div key={status.id} className="flex items-center gap-2">
              {editingStatus?.id === status.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") updateStatus();
                    }}
                  />
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-10 h-10 rounded border border-border cursor-pointer"
                  />
                  <Button size="sm" onClick={updateStatus}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingStatus(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Badge
                    variant="secondary"
                    className="py-2 px-3 text-sm flex-1 justify-start"
                    style={{ backgroundColor: status.color || "#6b7280", color: "#fff" }}
                  >
                    {status.name}
                  </Badge>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(status)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeStatus(status.id)}
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {robotStatuses.length === 0 && (
            <p className="text-sm text-muted-foreground">No statuses defined yet</p>
          )}
        </div>
      </div>
    );
  };

  const DictionaryEditor = () => {
    const [newValue, setNewValue] = useState("");
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");
    const currentCategory = categories.find(c => c.key === activeCategory);

    if (currentCategory?.type === "numeric") {
      return <NumericSettingEditor settingKey={activeCategory as keyof NumericSettings} />;
    }

    if (currentCategory?.type === "text_setting") {
      return (
        <div className="space-y-6">
          <div>
            <Label className="text-lg font-semibold">{currentCategory?.label}</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Configure the format for auto-generated contract numbers
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Contract Number Format</Label>
              <Input
                value={textSettings.contract_number_mask}
                onChange={(e) => setTextSettings(prev => ({ ...prev, contract_number_mask: e.target.value }))}
                disabled={!isAdmin}
                placeholder="CNT-{YYYY}-{NNN}"
                className="mt-1"
              />
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Available placeholders:</p>
              <ul className="list-disc list-inside ml-2">
                <li><code className="bg-muted px-1 rounded">{"{YYYY}"}</code> - Current year (e.g., 2025)</li>
                <li><code className="bg-muted px-1 rounded">{"{NNN}"}</code> - Sequential number (e.g., 001, 002)</li>
              </ul>
              <p className="mt-2">Example: <code className="bg-muted px-1 rounded">CNT-{"{YYYY}"}-{"{NNN}"}</code> → CNT-2025-001</p>
            </div>
            <Button 
              onClick={() => updateTextSetting("contract_number_mask", textSettings.contract_number_mask)}
              disabled={!isAdmin}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      );
    }

    if (currentCategory?.type === "tags") {
      return <TagEditor />;
    }

    if (currentCategory?.type === "statuses") {
      return <StatusEditor />;
    }

    const dictionaryKey = activeCategory as keyof Dictionary;

    const updateItem = async (category: keyof Dictionary, index: number, newName: string) => {
      if (!newName.trim()) return;

      // Handle manufacturers with database
      if (category === "manufacturers") {
        const oldName = dictionaries.manufacturers[index];
        const { error } = await supabase
          .from("manufacturer_dictionary")
          .update({ manufacturer_name: newName.trim() })
          .eq("manufacturer_name", oldName);

        if (error) {
          console.error("Error updating manufacturer:", error);
          toast.error("Failed to update manufacturer");
          return;
        }
        await fetchManufacturers();
        toast.success("Manufacturer updated successfully");
        setEditingIndex(null);
        return;
      }

      // Handle robot types with database
      if (category === "robot_types") {
        const oldName = dictionaries.robot_types[index];
        const { error } = await supabase
          .from("robot_type_dictionary")
          .update({ type_name: newName.trim() })
          .eq("type_name", oldName);

        if (error) {
          console.error("Error updating robot type:", error);
          toast.error("Failed to update robot type");
          return;
        }
        await fetchRobotTypes();
        toast.success("Robot type updated successfully");
        setEditingIndex(null);
        return;
      }

      // Handle client types with database
      if (category === "client_types") {
        const item = dictionaryIds.client_types[index];
        if (!item) return;
        const { error } = await supabase
          .from("client_type_dictionary")
          .update({ name: newName.trim() })
          .eq("id", item.id);

        if (error) {
          console.error("Error updating client type:", error);
          toast.error("Failed to update client type");
          return;
        }
        await fetchClientTypes();
        toast.success("Client type updated successfully");
        setEditingIndex(null);
        return;
      }

      // Handle markets with database
      if (category === "markets") {
        const item = dictionaryIds.markets[index];
        if (!item) return;
        const { error } = await supabase
          .from("market_dictionary")
          .update({ name: newName.trim() })
          .eq("id", item.id);

        if (error) {
          console.error("Error updating market:", error);
          toast.error("Failed to update market");
          return;
        }
        await fetchMarkets();
        toast.success("Market updated successfully");
        setEditingIndex(null);
        return;
      }

      // Handle segments with database
      if (category === "segments") {
        const item = dictionaryIds.segments[index];
        if (!item) return;
        const { error } = await supabase
          .from("segment_dictionary")
          .update({ name: newName.trim() })
          .eq("id", item.id);

        if (error) {
          console.error("Error updating segment:", error);
          toast.error("Failed to update segment");
          return;
        }
        await fetchSegments();
        toast.success("Segment updated successfully");
        setEditingIndex(null);
        return;
      }

      // Handle client sizes with database
      if (category === "client_sizes") {
        const item = dictionaryIds.client_sizes[index];
        if (!item) return;
        const { error } = await supabase
          .from("client_size_dictionary")
          .update({ name: newName.trim() })
          .eq("id", item.id);

        if (error) {
          console.error("Error updating client size:", error);
          toast.error("Failed to update client size");
          return;
        }
        await fetchClientSizes();
        toast.success("Client size updated successfully");
        setEditingIndex(null);
        return;
      }

      // Handle other categories (client-side only for now)
      setDictionaries((prev) => ({
        ...prev,
        [category]: prev[category].map((item, i) => (i === index ? newName.trim() : item)),
      }));
      setEditingIndex(null);
      toast.success("Item updated successfully");
    };

    const startEditing = (index: number, currentValue: string) => {
      setEditingIndex(index);
      setEditValue(currentValue);
    };

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

        <div className="space-y-2">
          {dictionaries[dictionaryKey]?.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {editingIndex === index ? (
                <>
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") updateItem(dictionaryKey, index, editValue);
                    }}
                  />
                  <Button size="sm" onClick={() => updateItem(dictionaryKey, index, editValue)}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingIndex(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Badge variant="secondary" className="py-2 px-3 text-sm flex-1 justify-start">
                    {item}
                  </Badge>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(index, item)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(dictionaryKey, index)}
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
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
