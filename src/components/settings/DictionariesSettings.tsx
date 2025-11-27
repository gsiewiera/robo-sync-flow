import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
};

export const DictionariesSettings = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
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

  const DictionaryEditor = ({ category, title }: { category: keyof Dictionary; title: string }) => {
    const [newValue, setNewValue] = useState("");

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder={`Add new ${title.toLowerCase()}`}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                addItem(category, newValue);
                setNewValue("");
              }
            }}
            disabled={!isAdmin}
          />
          <Button
            onClick={() => {
              addItem(category, newValue);
              setNewValue("");
            }}
            disabled={!isAdmin}
          >
            Add
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {dictionaries[category].map((item, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {item}
              {isAdmin && (
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeItem(category, index)}
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
      <CardContent>
        <Tabs defaultValue="robot_models">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="robot_models">Robot Models</TabsTrigger>
            <TabsTrigger value="robot_types">Robot Types</TabsTrigger>
            <TabsTrigger value="client_types">Client Types</TabsTrigger>
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="contract_types">Contract Types</TabsTrigger>
            <TabsTrigger value="service_types">Service Types</TabsTrigger>
            <TabsTrigger value="payment_models">Payment</TabsTrigger>
            <TabsTrigger value="billing_schedules">Billing</TabsTrigger>
            <TabsTrigger value="priorities">Priorities</TabsTrigger>
            <TabsTrigger value="countries">Countries</TabsTrigger>
          </TabsList>

          <TabsContent value="robot_models" className="mt-4">
            <div className="space-y-2">
              <Label>Robot Models</Label>
              <DictionaryEditor category="robot_models" title="Robot Model" />
            </div>
          </TabsContent>

          <TabsContent value="robot_types" className="mt-4">
            <div className="space-y-2">
              <Label>Robot Types</Label>
              <DictionaryEditor category="robot_types" title="Robot Type" />
            </div>
          </TabsContent>

          <TabsContent value="client_types" className="mt-4">
            <div className="space-y-2">
              <Label>Client Types</Label>
              <DictionaryEditor category="client_types" title="Client Type" />
            </div>
          </TabsContent>

          <TabsContent value="markets" className="mt-4">
            <div className="space-y-2">
              <Label>Markets</Label>
              <DictionaryEditor category="markets" title="Market" />
            </div>
          </TabsContent>

          <TabsContent value="segments" className="mt-4">
            <div className="space-y-2">
              <Label>Segments</Label>
              <DictionaryEditor category="segments" title="Segment" />
            </div>
          </TabsContent>

          <TabsContent value="contract_types" className="mt-4">
            <div className="space-y-2">
              <Label>Contract Types</Label>
              <DictionaryEditor category="contract_types" title="Contract Type" />
            </div>
          </TabsContent>

          <TabsContent value="service_types" className="mt-4">
            <div className="space-y-2">
              <Label>Service Types</Label>
              <DictionaryEditor category="service_types" title="Service Type" />
            </div>
          </TabsContent>

          <TabsContent value="payment_models" className="mt-4">
            <div className="space-y-2">
              <Label>Payment Models</Label>
              <DictionaryEditor category="payment_models" title="Payment Model" />
            </div>
          </TabsContent>

          <TabsContent value="billing_schedules" className="mt-4">
            <div className="space-y-2">
              <Label>Billing Schedules</Label>
              <DictionaryEditor category="billing_schedules" title="Billing Schedule" />
            </div>
          </TabsContent>

          <TabsContent value="priorities" className="mt-4">
            <div className="space-y-2">
              <Label>Service Priorities</Label>
              <DictionaryEditor category="priorities" title="Priority" />
            </div>
          </TabsContent>

          <TabsContent value="countries" className="mt-4">
            <div className="space-y-2">
              <Label>Countries</Label>
              <DictionaryEditor category="countries" title="Country" />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
