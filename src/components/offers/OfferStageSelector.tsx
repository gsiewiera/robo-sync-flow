import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface OfferStageSelectorProps {
  offerId: string;
  currentStage: string;
  onStageChange?: () => void;
}

const stageOptions = [
  { value: "leads", label: "Leads", color: "hsl(var(--chart-1))" },
  { value: "qualified", label: "Qualified", color: "hsl(var(--chart-2))" },
  { value: "proposal_sent", label: "Proposal Sent", color: "hsl(var(--chart-3))" },
  { value: "negotiation", label: "In Negotiation", color: "hsl(var(--chart-4))" },
  { value: "closed_won", label: "Closed Won", color: "hsl(var(--success))" },
  { value: "closed_lost", label: "Closed Lost", color: "hsl(var(--destructive))" },
];

export const OfferStageSelector = ({ offerId, currentStage, onStageChange }: OfferStageSelectorProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleStageChange = async (newStage: string) => {
    setIsUpdating(true);
    try {
      // Validate: moving from "leads" to any other stage requires at least one item
      if (currentStage === "leads" && newStage !== "leads") {
        const { data: items, error: itemsError } = await supabase
          .from("offer_items")
          .select("id")
          .eq("offer_id", offerId)
          .limit(1);

        if (itemsError) throw itemsError;

        if (!items || items.length === 0) {
          toast({
            title: "Cannot change stage",
            description: "Please add at least one robot/item to the offer before moving to qualified stage",
            variant: "destructive",
          });
          setIsUpdating(false);
          return;
        }
      }

      const { error } = await supabase
        .from("offers")
        .update({ stage: newStage })
        .eq("id", offerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Offer stage updated successfully",
      });

      if (onStageChange) {
        onStageChange();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update offer stage",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStageInfo = stageOptions.find(s => s.value === currentStage);

  return (
    <div className="space-y-2">
      <Label htmlFor="stage-selector">Sales Funnel Stage</Label>
      <Select
        value={currentStage}
        onValueChange={handleStageChange}
        disabled={isUpdating}
      >
        <SelectTrigger id="stage-selector" className="w-full">
          <SelectValue>
            <span 
              className="inline-block w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: currentStageInfo?.color }}
            />
            {currentStageInfo?.label || "Select stage"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {stageOptions.map((stage) => (
            <SelectItem key={stage.value} value={stage.value}>
              <div className="flex items-center gap-2">
                <span 
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                {stage.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
