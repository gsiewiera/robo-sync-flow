import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface FunnelStage {
  name: string;
  count: number;
  value: number;
  color: string;
}

interface FunnelVisualizationProps {
  stages: FunnelStage[];
}

export const FunnelVisualization = ({ stages }: FunnelVisualizationProps) => {
  const maxCount = Math.max(...stages.map(s => s.count), 1);
  const maxValue = Math.max(...stages.map(s => s.value), 1);

  const calculateConversionRate = (currentIndex: number) => {
    if (currentIndex === 0) return 100;
    const previous = stages[currentIndex - 1].count;
    const current = stages[currentIndex].count;
    if (previous === 0) return 0;
    return ((current / previous) * 100).toFixed(1);
  };

  return (
    <div className="space-y-1">
      {stages.map((stage, index) => {
        const widthPercentage = (stage.count / maxCount) * 100;
        const conversionRate = calculateConversionRate(index);
        
        return (
          <div key={stage.name} className="relative">
            {/* Funnel stage */}
            <div 
              className="transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              style={{
                width: `${Math.max(widthPercentage, 20)}%`,
                margin: '0 auto',
              }}
            >
              <Card 
                className="overflow-hidden border-2"
                style={{
                  backgroundColor: `${stage.color}15`,
                  borderColor: stage.color,
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{stage.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="font-medium">{stage.count} deals</span>
                        <span>•</span>
                        <span className="font-medium">
                          {stage.value.toLocaleString("en-US", { 
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0 
                          })} PLN
                        </span>
                      </div>
                    </div>
                    {index > 0 && (
                      <div className="text-right">
                        <div 
                          className="text-2xl font-bold"
                          style={{ color: stage.color }}
                        >
                          {conversionRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          conversion
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Connecting line */}
            {index < stages.length - 1 && (
              <div className="h-4 flex items-center justify-center">
                <div 
                  className="w-0.5 h-full"
                  style={{ backgroundColor: stages[index + 1].color }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
