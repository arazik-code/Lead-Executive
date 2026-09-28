import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Inbox,
  Clock,
  CheckCircle,
  ArrowRight,
  Phone,
  DollarSign,
  Calendar,
  Home,
  MoreVertical,
  MessageSquare,
  Eye,
  Edit3,
  UserPlus,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeads, Lead } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const colorStyles = {
  accent: {
    icon: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/30",
    badge: "neon" as const,
  },
  warning: {
    icon: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    badge: "warning" as const,
  },
  success: {
    icon: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    badge: "success" as const,
  },
  primary: {
    icon: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    badge: "neon-silver" as const,
  },
};

interface LeadPipelineCardProps {
  lead: Lead;
  color: keyof typeof colorStyles;
  onMoveNext?: () => void;
  onViewDetails?: () => void;
  onMessage?: () => void;
  onAssign?: () => void;
}

function LeadPipelineCard({ lead, color, onMoveNext, onViewDetails, onMessage, onAssign }: LeadPipelineCardProps) {
  const styles = colorStyles[color];
  const progressPercentage = (lead.score / 100) * 100;

  return (
    <Card variant="glass" className={cn("hover:border-accent/30 transition-all duration-300 cursor-pointer group")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold font-display", styles.bg, styles.icon)}>
              {lead.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <h4 className="font-medium text-sm text-foreground">{lead.name}</h4>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {lead.phone}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewDetails}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onMessage}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Message
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAssign}>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Agent
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onMoveNext}>
                <ChevronRight className="mr-2 h-4 w-4" />
                Move to Next Stage
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Lead Details */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span>{lead.budget || "TBD"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{lead.timeline || "TBD"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Home className="h-3 w-3" />
            <span>{lead.propertyType || "TBD"}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Lead Score</span>
            <span className={styles.icon}>{lead.score}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all duration-500", color === "success" ? "bg-success" : color === "warning" ? "bg-warning" : "bg-accent")}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <Badge variant={styles.badge}>Score: {lead.score}</Badge>
          <span className="text-[10px] text-muted-foreground capitalize">{lead.intent} intent</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Pipeline() {
  const { leads, updateLead } = useLeads();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Group leads by status
  const newLeads = leads.filter(l => l.status === "New");
  const qualifyingLeads = leads.filter(l => l.status === "Qualifying");
  const qualifiedLeads = leads.filter(l => l.status === "Qualified");
  const routedLeads = leads.filter(l => l.status === "Routed");

  const stages = [
    {
      id: "new",
      title: "New Inquiries",
      icon: Inbox,
      color: "accent" as const,
      leads: newLeads,
      nextStatus: "Qualifying" as const,
    },
    {
      id: "qualifying",
      title: "Qualifying",
      icon: Clock,
      color: "warning" as const,
      leads: qualifyingLeads,
      nextStatus: "Qualified" as const,
    },
    {
      id: "qualified",
      title: "Qualified",
      icon: CheckCircle,
      color: "success" as const,
      leads: qualifiedLeads,
      nextStatus: "Routed" as const,
    },
    {
      id: "routed",
      title: "Routed/Closed",
      icon: ArrowRight,
      color: "primary" as const,
      leads: routedLeads,
      nextStatus: null,
    },
  ];

  const handleMoveNext = (lead: Lead, nextStatus: Lead["status"] | null) => {
    if (!nextStatus) {
      toast({
        title: "End of pipeline",
        description: "This lead is already at the final stage.",
      });
      return;
    }
    updateLead(lead.id, { status: nextStatus });
    toast({
      title: "Lead moved",
      description: `${lead.name} has been moved to the next stage.`,
    });
  };

  const handleViewDetails = (lead: Lead) => {
    navigate("/leads");
    toast({
      title: "View Details",
      description: `Opening details for ${lead.name}`,
    });
  };

  const handleMessage = (lead: Lead) => {
    navigate("/messages");
    toast({
      title: "Message Lead",
      description: `Opening conversation with ${lead.name}`,
    });
  };

  const handleAssign = (lead: Lead) => {
    toast({
      title: "Assign Agent",
      description: `Agent assignment for ${lead.name} - Coming soon!`,
    });
  };

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display tracking-tight gradient-text mb-2">
          Lead Pipeline
        </h1>
        <p className="text-muted-foreground">
          Visual pipeline view of all leads through the qualification process
        </p>
      </div>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const styles = colorStyles[stage.color];

          return (
            <div key={stage.id} className="space-y-4">
              {/* Stage Header */}
              <Card variant="glass" className={styles.border}>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", styles.icon)} />
                      <span>{stage.title}</span>
                    </div>
                    <Badge variant={styles.badge}>{stage.leads.length}</Badge>
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Leads */}
              <div className="space-y-3">
                {stage.leads.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                    No leads in this stage
                  </div>
                ) : (
                  stage.leads.map((lead) => (
                    <LeadPipelineCard
                      key={lead.id}
                      lead={lead}
                      color={stage.color}
                      onMoveNext={() => handleMoveNext(lead, stage.nextStatus)}
                      onViewDetails={() => handleViewDetails(lead)}
                      onMessage={() => handleMessage(lead)}
                      onAssign={() => handleAssign(lead)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </MainLayout>
  );
}
