import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Task {
  title: string;
  status: string;
  due_date: string | null;
  clients: { name: string } | null;
}

interface Lead {
  offer_number: string;
  lead_status: string;
  created_at: string;
  clients: { name: string } | null;
}

interface Offer {
  offer_number: string;
  stage: string;
  total_price: number | null;
  clients: { name: string } | null;
}

interface Contract {
  contract_number: string;
  status: string;
  total_purchase_value: number | null;
  clients: { name: string } | null;
}

interface Client {
  name: string;
  city: string | null;
  status: string | null;
}

interface KPIData {
  totalSales: number;
  totalTasks: number;
  completedTasks: number;
  totalLeads: number;
  totalOffers: number;
  signedContracts: number;
  assignedClients: number;
  totalRevenue: number;
}

interface SalespersonAISummaryProps {
  salespersonName: string;
  salespersonEmail: string;
  dateRange: { from: Date; to: Date } | undefined;
  kpiData: KPIData;
  tasks: Task[];
  leads: Lead[];
  offers: Offer[];
  contracts: Contract[];
  clients: Client[];
}

export const SalespersonAISummary = ({
  salespersonName,
  salespersonEmail,
  dateRange,
  kpiData,
  tasks,
  leads,
  offers,
  contracts,
  clients,
}: SalespersonAISummaryProps) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateSummary = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("salesperson-ai-summary", {
        body: {
          salespersonName,
          salespersonEmail,
          dateRange: dateRange ? {
            from: dateRange.from.toISOString(),
            to: dateRange.to.toISOString(),
          } : null,
          kpiData,
          tasks: tasks.slice(0, 20),
          leads: leads.slice(0, 15),
          offers: offers.slice(0, 15),
          contracts: contracts.slice(0, 10),
          clients: clients.slice(0, 20),
        },
      });

      if (error) throw error;
      setSummary(data.summary);
    } catch (error: any) {
      console.error("Error generating summary:", error);
      toast({
        title: "Error generating summary",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">AI Performance Analysis</h3>
        </div>
        <Button
          onClick={generateSummary}
          disabled={isLoading}
          size="sm"
          variant={summary ? "outline" : "default"}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : summary ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Analysis
            </>
          )}
        </Button>
      </div>

      {!summary && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Click "Generate Analysis" to get an AI-powered performance summary.</p>
          <p className="text-sm mt-2">
            The AI will analyze tasks, leads, offers, contracts, and clients to provide insights.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
            <p className="text-muted-foreground">Analyzing performance data...</p>
          </div>
        </div>
      )}

      {summary && !isLoading && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="text-sm leading-relaxed space-y-3">
            {summary.split('\n\n').map((section, idx) => {
              const isPositive = /strengths?|opportunit|success|achieved|exceeded|strong|excellent|positive|growth|improvement|won|closed|completed/i.test(section);
              const isNegative = /risk|concern|attention|challenge|warning|issue|problem|delay|overdue|missed|lost|weak|decline|urgent|critical|improvement needed|areas? for improvement/i.test(section);
              
              return (
                <div 
                  key={idx} 
                  className={`whitespace-pre-wrap ${
                    isNegative ? 'text-destructive' : 
                    isPositive ? 'text-success' : 
                    'text-foreground'
                  }`}
                >
                  {section}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {summary && (
        <div className="pt-4 border-t text-xs text-muted-foreground flex items-center gap-2">
          <Sparkles className="w-3 h-3" />
          AI-generated analysis based on available performance data
        </div>
      )}
    </Card>
  );
};
