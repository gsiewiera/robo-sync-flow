import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReportSubscription {
  id: string;
  report_type: string;
  recipient_email: string;
  recipient_name: string;
  frequency: string;
  enabled: boolean;
  last_sent_at: string | null;
}

export const ReportSubscriptionsSettings = () => {
  const [subscriptions, setSubscriptions] = useState<ReportSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    recipient_name: "",
    recipient_email: "",
    report_type: "all",
    frequency: "weekly",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    const { data, error } = await supabase
      .from("report_subscriptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load subscriptions",
        variant: "destructive",
      });
      return;
    }

    setSubscriptions(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("report_subscriptions").insert({
      ...formData,
      created_by: user?.id,
      enabled: true,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create subscription",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Report subscription created successfully",
      });
      setShowForm(false);
      setFormData({
        recipient_name: "",
        recipient_email: "",
        report_type: "all",
        frequency: "weekly",
      });
      fetchSubscriptions();
    }

    setIsLoading(false);
  };

  const toggleEnabled = async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from("report_subscriptions")
      .update({ enabled })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive",
      });
      return;
    }

    fetchSubscriptions();
  };

  const deleteSubscription = async (id: string) => {
    const { error } = await supabase
      .from("report_subscriptions")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete subscription",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Subscription deleted successfully",
    });
    fetchSubscriptions();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Scheduled Report Subscriptions
            </CardTitle>
            <CardDescription>
              Configure automated email reports for managers and stakeholders
            </CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Subscription
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label htmlFor="recipient_name">Recipient Name</Label>
              <Input
                id="recipient_name"
                value={formData.recipient_name}
                onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient_email">Recipient Email</Label>
              <Input
                id="recipient_email"
                type="email"
                value={formData.recipient_email}
                onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="report_type">Report Type</Label>
              <Select
                value={formData.report_type}
                onValueChange={(value) => setFormData({ ...formData, report_type: value })}
              >
                <SelectTrigger id="report_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="sales">Sales Report</SelectItem>
                  <SelectItem value="activity">Activity Report</SelectItem>
                  <SelectItem value="reseller">Reseller Report</SelectItem>
                  <SelectItem value="ending">Ending Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                Create Subscription
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {subscriptions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No report subscriptions configured yet
            </p>
          ) : (
            subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{sub.recipient_name}</p>
                    <Badge variant="secondary">{sub.frequency}</Badge>
                    <Badge variant="outline">{sub.report_type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{sub.recipient_email}</p>
                  {sub.last_sent_at && (
                    <p className="text-xs text-muted-foreground">
                      Last sent: {new Date(sub.last_sent_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={sub.enabled}
                    onCheckedChange={(checked) => toggleEnabled(sub.id, checked)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSubscription(sub.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
