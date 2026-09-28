import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  TrendingUp,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

interface ScoreRule {
  id: string;
  name: string;
  description: string;
  scoreRange: [number, number];
  action: string;
  color: "success" | "warning" | "destructive" | "secondary";
}

const mockRules: ScoreRule[] = [
  {
    id: "1",
    name: "Hot Lead",
    description: "Highly qualified, ready to buy",
    scoreRange: [80, 100],
    action: "Route immediately to top agent",
    color: "success",
  },
  {
    id: "2",
    name: "Warm Lead",
    description: "Good potential, needs nurturing",
    scoreRange: [60, 79],
    action: "Add to priority follow-up queue",
    color: "warning",
  },
  {
    id: "3",
    name: "Cold Lead",
    description: "Low engagement or misaligned criteria",
    scoreRange: [40, 59],
    action: "Schedule automated nurture sequence",
    color: "secondary",
  },
  {
    id: "4",
    name: "Unqualified",
    description: "Does not meet minimum criteria",
    scoreRange: [0, 39],
    action: "Archive with reason",
    color: "destructive",
  },
];

export function ScoringRules() {
  const getIcon = (color: string) => {
    switch (color) {
      case "success":
        return <Zap className="h-5 w-5 text-success" />;
      case "warning":
        return <TrendingUp className="h-5 w-5 text-warning" />;
      case "secondary":
        return <Clock className="h-5 w-5 text-muted-foreground" />;
      case "destructive":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Target className="h-5 w-5 text-accent" />;
    }
  };

  const getBarColor = (color: string) => {
    switch (color) {
      case "success":
        return "bg-success";
      case "warning":
        return "bg-warning";
      case "destructive":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5 text-accent" />
          Scoring Thresholds
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Bar Visualization */}
        <div className="relative h-8 rounded-lg overflow-hidden bg-secondary flex">
          {mockRules
            .slice()
            .reverse()
            .map((rule) => {
              const width = rule.scoreRange[1] - rule.scoreRange[0] + 1;
              return (
                <div
                  key={rule.id}
                  className={`h-full ${getBarColor(rule.color)} opacity-80`}
                  style={{ width: `${width}%` }}
                />
              );
            })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>

        {/* Rules List */}
        <div className="space-y-3 pt-4">
          {mockRules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
            >
              <div className="shrink-0 mt-0.5">{getIcon(rule.color)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm text-foreground">
                    {rule.name}
                  </h4>
                  <Badge
                    variant={rule.color === "success" ? "success" : rule.color === "warning" ? "warning" : "secondary"}
                    className="text-[10px]"
                  >
                    {rule.scoreRange[0]}-{rule.scoreRange[1]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {rule.description}
                </p>
                <div className="flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-accent" />
                  <span className="text-foreground">{rule.action}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
