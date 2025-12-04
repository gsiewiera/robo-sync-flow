import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Note {
  note_date: string;
  contact_type: string;
  contact_person: string | null;
  note: string | null;
  key_points: string | null;
  needs: string | null;
  commitments_us: string | null;
  commitments_client: string | null;
  risks: string | null;
  next_step: string | null;
  priority: string;
}

interface Task {
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  meeting_date_time: string | null;
  meeting_type: string | null;
}

interface Offer {
  offer_number: string;
  stage: string;
  total_price: number | null;
  created_at: string;
}

interface Contract {
  contract_number: string;
  status: string;
  monthly_payment: number | null;
  start_date: string | null;
}

interface ClientAISummaryProps {
  clientId: string;
  clientName: string;
  notes: Note[];
  tasks: Task[];
  offers: Offer[];
  contracts: Contract[];
  robots: { serial_number: string; model: string; status: string }[];
  tickets: { ticket_number: string; title: string; status: string; priority: string }[];
}

export const ClientAISummary = ({
  clientId,
  clientName,
  notes,
  tasks,
  offers,
  contracts,
  robots,
  tickets,
}: ClientAISummaryProps) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateSummary = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("client-ai-summary", {
        body: {
          clientName,
          notes: notes.slice(0, 20), // Limit to recent 20 notes
          tasks: tasks.slice(0, 10),
          offers: offers.slice(0, 10),
          contracts: contracts.slice(0, 5),
          robots: robots.slice(0, 10),
          tickets: tickets.slice(0, 10),
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
          <h3 className="font-semibold text-lg">AI Client Analysis</h3>
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
          <p>Click "Generate Analysis" to get an AI-powered summary of this client.</p>
          <p className="text-sm mt-2">
            The AI will analyze notes, tasks, offers, contracts, and service tickets to provide insights.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
            <p className="text-muted-foreground">Analyzing client data...</p>
          </div>
        </div>
      )}

      {summary && !isLoading && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{summary}</div>
        </div>
      )}

      {summary && (
        <div className="pt-4 border-t text-xs text-muted-foreground flex items-center gap-2">
          <Sparkles className="w-3 h-3" />
          AI-generated summary based on available client data
        </div>
      )}
    </Card>
  );
};
