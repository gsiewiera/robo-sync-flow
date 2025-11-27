import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Dictionary = {
  robot_models: string[];
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
};

const categories = [
  { key: "robot_models", label: "Robot Models" },
  { key: "robot_types", label: "Robot Types" },
  { key: "client_types", label: "Client Types" },
  { key: "markets", label: "Markets" },
  { key: "segments", label: "Segments" },
  { key: "contract_types", label: "Contract Types" },
  { key: "service_types", label: "Service Types" },
  { key: "payment_models", label: "Payment Models" },
  { key: "billing_schedules", label: "Billing Schedules" },
  { key: "priorities", label: "Priorities" },
  { key: "countries", label: "Countries" },
  { key: "lease_months", label: "Lease Months" },
] as const;

export const DictionariesSettings = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<keyof Dictionary>("robot_models");
  const [dictionaries, setDictionaries] = useState<Dictionary>({
    robot_models: ["UR3", "UR5", "UR10", "UR16"],
    robot_types: ["Collaborative", "Industrial", "Mobile", "Delta"],
    client_types: ["Enterprise", "SME", "Startup", "Government"],
    markets: ["Manufacturing", "Logistics", "Healthcare", "Automotive"],
    segments: ["Welding", "Assembly", "Packaging", "Quality Control"],
    contract_types: ["Service Agreement", "Maintenance Contract", "Full Support", "On-Demand"],
    service_types: ["Preventive Maintenance", "Repair", "Upgrade", "Training", "Consultation"],
    payment_models: ["Lease", "Purchase", "Subscription", "Pay-per-use"],
    billing_schedules: ["Monthly", "Quarterly", "Annual", "One-time"],
    priorities: ["low", "medium", "high", "critical"],
    countries: ["Poland", "Germany", "Czech Republic", "Slovakia"],
    lease_months: ["6", "12", "24", "36", "48"],
  });

  useEffect(() => {
    checkAdminRole();
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

  const addItem = (category: keyof Dictionary, value: string) => {
    if (!value.trim()) return;
    setDictionaries((prev) => ({
      ...prev,
      [category]: [...prev[category], value.trim()],
    }));
  };

  const removeItem = (category: keyof Dictionary, index: number) => {
    setDictionaries((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  const DictionaryEditor = () => {
    const [newValue, setNewValue] = useState("");
    const currentCategory = categories.find(c => c.key === activeCategory);

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
                addItem(activeCategory, newValue);
                setNewValue("");
              }
            }}
            disabled={!isAdmin}
            className="flex-1"
          />
          <Button
            onClick={() => {
              addItem(activeCategory, newValue);
              setNewValue("");
            }}
            disabled={!isAdmin}
          >
            Add
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {dictionaries[activeCategory].map((item, index) => (
            <Badge key={index} variant="secondary" className="gap-2 py-2 px-3 text-sm">
              {item}
              {isAdmin && (
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeItem(activeCategory, index)}
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
