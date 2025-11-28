import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

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
    <div className="space-y-2 py-4">
      {stages.map((stage, index) => {
        const widthPercentage = (stage.count / maxCount) * 100;
        const conversionRate = calculateConversionRate(index);
        
        return (
          <div key={stage.name} className="relative animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
            {/* Funnel stage */}
            <div 
              className="transition-all duration-500 hover:scale-[1.02] cursor-pointer group"
              style={{
                width: `${Math.max(widthPercentage, 25)}%`,
                margin: '0 auto',
              }}
            >
              <Card 
                className="overflow-hidden border-2 shadow-lg hover:shadow-2xl transition-all duration-300 relative"
                style={{
                  background: `linear-gradient(135deg, ${stage.color}20 0%, ${stage.color}08 100%)`,
                  borderColor: stage.color,
                  boxShadow: `0 4px 20px ${stage.color}30, 0 0 40px ${stage.color}15`,
                }}
              >
                {/* Animated gradient overlay */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${stage.color}15 0%, transparent 100%)`,
                  }}
                />
                
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className="w-3 h-3 rounded-full animate-pulse"
                          style={{ backgroundColor: stage.color }}
                        />
                        <h3 className="font-bold text-xl tracking-tight">{stage.name}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg" style={{ color: stage.color }}>
                            {stage.count}
                          </span>
                          <span className="text-muted-foreground">deals</span>
                        </div>
                        <span className="text-muted-foreground/50">•</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg" style={{ color: stage.color }}>
                            {stage.value.toLocaleString("en-US", { 
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0 
                            })}
                          </span>
                          <span className="text-muted-foreground">PLN</span>
                        </div>
                      </div>
                    </div>
                    {index > 0 && (
                      <div className="text-right pl-6">
                        <div 
                          className="text-4xl font-black tracking-tighter transition-all duration-300 group-hover:scale-110"
                          style={{ 
                            color: stage.color,
                            textShadow: `0 0 20px ${stage.color}40`
                          }}
                        >
                          {conversionRate}%
                        </div>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">
                          conversion
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>

                {/* Bottom glow bar */}
                <div 
                  className="h-1 w-full transition-all duration-300 group-hover:h-2"
                  style={{
                    background: `linear-gradient(90deg, ${stage.color} 0%, ${stage.color}80 100%)`,
                    boxShadow: `0 2px 10px ${stage.color}60`
                  }}
                />
              </Card>
            </div>

            {/* Animated connecting arrow */}
            {index < stages.length - 1 && (
              <div className="h-8 flex items-center justify-center relative animate-fade-in" style={{ animationDelay: `${index * 100 + 50}ms` }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ChevronDown 
                    className="w-6 h-6 animate-bounce"
                    style={{ 
                      color: stages[index + 1].color,
                      filter: `drop-shadow(0 0 8px ${stages[index + 1].color}60)`
                    }}
                  />
                </div>
                <div 
                  className="w-0.5 h-full animate-pulse"
                  style={{ 
                    background: `linear-gradient(180deg, ${stage.color} 0%, ${stages[index + 1].color} 100%)`,
                    boxShadow: `0 0 10px ${stage.color}40`
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
