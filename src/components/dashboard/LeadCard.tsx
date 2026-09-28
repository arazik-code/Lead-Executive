import { MessageSquare, Phone, Clock, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  name: string;
  phone: string;
  budget: string;
  intent: "High" | "Medium" | "Low";
  timeline: string;
  propertyType: string;
  source: string;
  timestamp: string;
  score: number;
}

interface LeadCardProps {
  lead: Lead;
}

const intentVariants = {
  High: "high",
  Medium: "medium",
  Low: "low",
} as const;

export function LeadCard({ lead }: LeadCardProps) {
  const navigate = useNavigate();

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-muted-foreground";
  };

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left - Lead Info */}
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-medium text-foreground">
                {lead.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <h3 className="font-medium text-foreground text-sm">{lead.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {lead.phone}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DollarSign className="h-3 w-3 text-success" />
                <span>{lead.budget}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3 w-3 text-warning" />
                <span>{lead.timeline}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              <Badge variant={intentVariants[lead.intent]}>{lead.intent}</Badge>
              <Badge variant="outline">{lead.propertyType}</Badge>
              <Badge variant="secondary">{lead.source}</Badge>
            </div>
          </div>

          {/* Right - Score & Actions */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-col items-center justify-center rounded-md border border-border bg-secondary/50 px-2.5 py-1.5">
              <span className={cn("text-lg font-semibold", getScoreColor(lead.score))}>
                {lead.score}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase">Score</span>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1 h-7 text-xs"
              onClick={() => navigate("/messages")}
            >
              <MessageSquare className="h-3 w-3" />
              View
            </Button>

            <span className="text-[10px] text-muted-foreground">{lead.timestamp}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
