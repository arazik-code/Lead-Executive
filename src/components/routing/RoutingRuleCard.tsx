import { useState } from "react";
import {
  ArrowRight,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  MapPin,
  DollarSign,
  Clock,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface RoutingRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    type: string;
    operator: string;
    value: string;
  }[];
  action: {
    type: "assign" | "queue" | "rotate";
    target: string;
  };
  priority: number;
  enabled: boolean;
  matchCount: number;
}

const mockRules: RoutingRule[] = [
  {
    id: "1",
    name: "High-Value Hot Leads",
    description: "Route leads with budget >$750K and score >85 to senior agents",
    conditions: [
      { type: "Budget", operator: "greater than", value: "$750,000" },
      { type: "Lead Score", operator: "greater than", value: "85" },
    ],
    action: { type: "assign", target: "Senior Agent Pool" },
    priority: 1,
    enabled: true,
    matchCount: 45,
  },
  {
    id: "2",
    name: "Downtown Specialists",
    description: "Route downtown property inquiries to specialized agents",
    conditions: [
      { type: "Location", operator: "equals", value: "Downtown" },
    ],
    action: { type: "assign", target: "Downtown Team" },
    priority: 2,
    enabled: true,
    matchCount: 128,
  },
  {
    id: "3",
    name: "First-Time Buyer Support",
    description: "Route first-time buyers to patient, experienced agents",
    conditions: [
      { type: "Experience", operator: "equals", value: "First-time buyer" },
    ],
    action: { type: "rotate", target: "First-Time Buyer Specialists" },
    priority: 3,
    enabled: true,
    matchCount: 89,
  },
  {
    id: "4",
    name: "Immediate Needs",
    description: "Fast-track leads looking to buy immediately",
    conditions: [
      { type: "Timeline", operator: "equals", value: "Immediately" },
    ],
    action: { type: "queue", target: "Priority Queue" },
    priority: 4,
    enabled: true,
    matchCount: 34,
  },
  {
    id: "5",
    name: "Cash Buyers VIP",
    description: "Route cash buyers to VIP handling",
    conditions: [
      { type: "Financing", operator: "equals", value: "Paying cash" },
    ],
    action: { type: "assign", target: "VIP Team" },
    priority: 5,
    enabled: false,
    matchCount: 12,
  },
];

interface RoutingRuleCardProps {
  rule: RoutingRule;
  onToggle: (id: string) => void;
  onEdit?: (rule: RoutingRule) => void;
  onDelete?: (id: string) => void;
}

export function RoutingRuleCard({ rule, onToggle, onEdit, onDelete }: RoutingRuleCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getConditionIcon = (type: string) => {
    switch (type) {
      case "Budget":
        return <DollarSign className="h-3 w-3" />;
      case "Location":
        return <MapPin className="h-3 w-3" />;
      case "Lead Score":
        return <Target className="h-3 w-3" />;
      case "Timeline":
        return <Clock className="h-3 w-3" />;
      default:
        return <Zap className="h-3 w-3" />;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case "assign":
        return "Assign to";
      case "queue":
        return "Add to";
      case "rotate":
        return "Round-robin to";
      default:
        return type;
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card
        variant="glass"
        className={cn(
          "transition-all duration-300",
          !rule.enabled && "opacity-50"
        )}
      >
        <CardHeader className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 text-accent font-display font-bold text-sm">
                {rule.priority}
              </div>
              <Switch
                checked={rule.enabled}
                onCheckedChange={() => onToggle(rule.id)}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground">
                    {rule.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rule.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="text-[10px]">
                    {rule.matchCount} matches
                  </Badge>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>

              {/* Quick Preview */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/50 border border-border">
                  {rule.conditions.slice(0, 2).map((cond, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-[10px] gap-1"
                    >
                      {getConditionIcon(cond.type)}
                      {cond.type}
                    </Badge>
                  ))}
                  {rule.conditions.length > 2 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{rule.conditions.length - 2} more
                    </span>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-accent shrink-0" />
                <Badge variant="neon" className="text-[10px]">
                  {rule.action.target}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0 ml-16">
            {/* Conditions */}
            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium text-foreground">Conditions:</p>
              <div className="space-y-2">
                {rule.conditions.map((condition, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-xs bg-secondary/50 rounded-lg p-2"
                  >
                    {getConditionIcon(condition.type)}
                    <span className="text-foreground">{condition.type}</span>
                    <span className="text-muted-foreground">
                      {condition.operator}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {condition.value}
                    </Badge>
                    {index < rule.conditions.length - 1 && (
                      <Badge variant="outline" className="text-[10px] ml-auto">
                        AND
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action */}
            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium text-foreground">Action:</p>
              <div className="flex items-center gap-2 text-xs bg-accent/5 border border-accent/20 rounded-lg p-2">
                <Users className="h-4 w-4 text-accent" />
                <span className="text-muted-foreground">
                  {getActionLabel(rule.action.type)}
                </span>
                <Badge variant="neon" className="text-[10px]">
                  {rule.action.target}
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => onEdit?.(rule)}
              >
                <Edit3 className="mr-1 h-3 w-3" />
                Edit Rule
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-destructive hover:text-destructive"
                onClick={() => onDelete?.(rule.id)}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export { mockRules };
