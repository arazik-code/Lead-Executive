import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Lead } from "@/lib/store";
import {
  Phone,
  Mail,
  Calendar,
  Home,
  DollarSign,
  Clock,
  User,
  Target,
  MessageSquare,
  Edit,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onMessage: (lead: Lead) => void;
}

export function LeadDetailDialog({
  open,
  onOpenChange,
  lead,
  onEdit,
  onDelete,
  onMessage,
}: LeadDetailDialogProps) {
  if (!lead) return null;

  const getIntentColor = (intent: string): BadgeProps["variant"] => {
    switch (intent) {
      case "High":
        return "success";
      case "Medium":
        return "warning";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: string): BadgeProps["variant"] => {
    switch (status) {
      case "Qualified":
        return "success";
      case "Routed":
        return "neon";
      case "Qualifying":
        return "warning";
      default:
        return "secondary";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-lg font-bold text-accent">
              {lead.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{lead.name}</h3>
              <p className="text-sm text-muted-foreground font-normal">
                Lead Score: <span className={cn(
                  "font-bold",
                  lead.score >= 80 ? "text-success" : lead.score >= 50 ? "text-warning" : "text-muted-foreground"
                )}>{lead.score}</span>
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Badges */}
          <div className="flex items-center gap-2">
            <Badge variant={getIntentColor(lead.intent)}>{lead.intent} Intent</Badge>
            <Badge variant={getStatusColor(lead.status)}>{lead.status}</Badge>
            <Badge variant="outline">{lead.source}</Badge>
          </div>

          {/* Score Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Qualification Progress</span>
              <span className="text-foreground">
                {lead.questionsAnswered}/{lead.totalQuestions} Questions
              </span>
            </div>
            <Progress value={(lead.questionsAnswered / lead.totalQuestions) * 100} className="h-2" />
          </div>

          <Separator />

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{lead.phone}</span>
            </div>
            {lead.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{lead.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{lead.createdAt}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{lead.assignedTo}</span>
            </div>
          </div>

          <Separator />

          {/* Property Preferences */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <DollarSign className="h-4 w-4 mx-auto text-accent mb-1" />
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-sm font-medium">{lead.budget}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <Home className="h-4 w-4 mx-auto text-accent mb-1" />
              <p className="text-xs text-muted-foreground">Property</p>
              <p className="text-sm font-medium">{lead.propertyType}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <Clock className="h-4 w-4 mx-auto text-accent mb-1" />
              <p className="text-xs text-muted-foreground">Timeline</p>
              <p className="text-sm font-medium">{lead.timeline}</p>
            </div>
          </div>

          {/* Notes */}
          {lead.notes && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm font-medium">Notes</p>
                <p className="text-sm text-muted-foreground">{lead.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(lead)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  onDelete(lead.id);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
            <Button size="sm" onClick={() => onMessage(lead)}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Message
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
