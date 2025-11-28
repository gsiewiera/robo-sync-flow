import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Phone, Mail, Building2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Lead {
  id: string;
  offer_number: string;
  person_contact: string | null;
  deployment_location: string | null;
  created_at: string;
  total_price: number | null;
  currency: string;
  clients: {
    id: string;
    name: string;
    primary_contact_email: string | null;
    primary_contact_phone: string | null;
  };
}

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalValue: 0,
    thisMonth: 0,
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("offers")
        .select(`
          *,
          clients (
            id,
            name,
            primary_contact_email,
            primary_contact_phone
          )
        `)
        .eq("stage", "leads")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setLeads(data || []);

      // Calculate stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const totalValue = data?.reduce((sum, lead) => sum + (lead.total_price || 0), 0) || 0;
      const thisMonthCount = data?.filter(
        lead => new Date(lead.created_at) >= startOfMonth
      ).length || 0;

      setStats({
        totalLeads: data?.length || 0,
        totalValue,
        thisMonth: thisMonthCount,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (offerId: string) => {
    navigate(`/offers/${offerId}`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <UserPlus className="w-8 h-8" />
              Leads
            </h1>
            <p className="text-muted-foreground">Manage and track potential opportunities</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover-scale animate-fade-in bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Leads
              </CardTitle>
              <UserPlus className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.totalLeads}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active opportunities
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale animate-fade-in bg-gradient-to-br from-success/5 to-transparent" style={{ animationDelay: "100ms" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Value
              </CardTitle>
              <Building2 className="w-5 h-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {stats.totalValue.toLocaleString()} PLN
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Potential revenue
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale animate-fade-in bg-gradient-to-br from-chart-2/5 to-transparent" style={{ animationDelay: "200ms" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                This Month
              </CardTitle>
              <Calendar className="w-5 h-5 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ color: "hsl(var(--chart-2))" }}>
                {stats.thisMonth}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                New leads
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Leads List</CardTitle>
              {!isLoading && leads.length > 0 && (
                <Badge variant="outline" className="text-sm">
                  {leads.length} lead{leads.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Loading leads...</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  No leads found
                </p>
                <p className="text-sm text-muted-foreground">
                  Start by creating new offers in the leads stage
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Offer #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow 
                        key={lead.id} 
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleRowClick(lead.id)}
                      >
                        <TableCell className="font-medium">
                          {lead.offer_number}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            {lead.clients?.name || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead.person_contact || "-"}
                        </TableCell>
                        <TableCell>
                          {lead.clients?.primary_contact_email ? (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm">{lead.clients.primary_contact_email}</span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.clients?.primary_contact_phone ? (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm">{lead.clients.primary_contact_phone}</span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.deployment_location || "-"}
                        </TableCell>
                        <TableCell>
                          {lead.total_price 
                            ? `${lead.total_price.toLocaleString()} ${lead.currency}`
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          {format(new Date(lead.created_at), "MMM dd, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Leads;
