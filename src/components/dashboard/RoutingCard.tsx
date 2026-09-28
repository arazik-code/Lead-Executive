import { ArrowRight, UserCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RoutingRule {
  signal: "High" | "Medium" | "Low";
  destination: string;
  count: number;
  description: string;
}

const rules: RoutingRule[] = [
  {
    signal: "High",
    destination: "Senior Brokers",
    count: 12,
    description: "Serious buyers with budget & timeline",
  },
  {
    signal: "Medium",
    destination: "Junior Team",
    count: 28,
    description: "Interested but needs nurturing",
  },
  {
    signal: "Low",
    destination: "Nurture Queue",
    count: 15,
    description: "Early stage, long timeline",
  },
];

const signalStyles = {
  High: {
    bg: "bg-success/5",
    border: "border-success/20",
    text: "text-success",
  },
  Medium: {
    bg: "bg-warning/5",
    border: "border-warning/20",
    text: "text-warning",
  },
  Low: {
    bg: "bg-secondary",
    border: "border-border",
    text: "text-muted-foreground",
  },
};

export function RoutingCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <UserCheck className="h-4 w-4 text-muted-foreground" />
          Routing Rules
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.signal}
            className={cn(
              "flex items-center gap-3 rounded-md border p-3",
              signalStyles[rule.signal].bg,
              signalStyles[rule.signal].border
            )}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <Badge
                  variant={rule.signal === "High" ? "high" : rule.signal === "Medium" ? "medium" : "low"}
                >
                  {rule.signal}
                </Badge>
                <span className="text-xs text-muted-foreground">{rule.count} leads</span>
              </div>
              <p className="text-xs text-muted-foreground">{rule.description}</p>
            </div>

            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />

            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary">
                <Users className="h-3.5 w-3.5 text-foreground" />
              </div>
              <span className="text-sm text-foreground">{rule.destination}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
