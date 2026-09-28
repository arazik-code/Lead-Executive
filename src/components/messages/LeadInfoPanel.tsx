import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Home,
  Clock,
  Tag,
  FileText,
  MessageSquare,
  TrendingUp,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMessages, useLeads } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

interface LeadInfoPanelProps {
  conversationId: string | null;
}

export function LeadInfoPanel({ conversationId }: LeadInfoPanelProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { conversations } = useMessages();
  const { leads } = useLeads();

  if (!conversationId) {
    return (
      <div className="h-full bg-card/30 border-l border-border p-6">
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">Select a conversation to view lead details</p>
        </div>
      </div>
    );
  }

  const conversation = conversations.find(c => c.id === conversationId);
  const lead = conversation ? leads.find(l => l.id === conversation.leadId) : null;

  if (!lead) {
    return (
      <div className="h-full bg-card/30 border-l border-border p-6">
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">Lead information not available</p>
        </div>
      </div>
    );
  }

  const initials = lead.name.split(" ").map(n => n[0]).join("");
  const scoreBreakdown = {
    budget: Math.min(100, lead.score + 5),
    timeline: Math.min(100, lead.score - 4),
    location: Math.min(100, lead.score),
    engagement: Math.min(100, lead.score - 2),
  };

  const handleScheduleViewing = () => {
    toast({
      title: "Viewing Scheduled",
      description: `A viewing request has been sent to ${lead.name}`,
    });
  };

  const handleAssignAgent = () => {
    toast({
      title: "Agent Assignment",
      description: "Opening agent assignment dialog...",
    });
  };

  const handleViewProfile = () => {
    navigate("/leads");
  };

  return (
    <ScrollArea className="h-full bg-card/30 border-l border-border">
      <div className="p-6 space-y-6">
        {/* Lead Profile */}
        <div className="text-center">
          <Avatar className="h-20 w-20 mx-auto border-2 border-accent/30 mb-4">
            <AvatarFallback className="bg-secondary text-foreground text-xl font-display">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-display text-lg font-semibold text-foreground">
            {lead.name}
          </h3>
          <p className="text-sm text-muted-foreground">{lead.propertyType || "Property enquiry"}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge variant={lead.score >= 80 ? "success" : lead.score >= 60 ? "warning" : "secondary"}>
              {lead.score >= 80 ? "Hot Lead" : lead.score >= 60 ? "Warm Lead" : "Cold Lead"}
            </Badge>
            <Badge variant="neon">Score: {lead.score}</Badge>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Lead Score Breakdown */}
        <Card variant="glass" className="p-4">
          <CardTitle className="text-sm font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            Qualification Score
          </CardTitle>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Budget Alignment</span>
                <span className="text-foreground">{scoreBreakdown.budget}%</span>
              </div>
              <Progress value={scoreBreakdown.budget} className="h-1.5" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Timeline Urgency</span>
                <span className="text-foreground">{scoreBreakdown.timeline}%</span>
              </div>
              <Progress value={scoreBreakdown.timeline} className="h-1.5" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Location Match</span>
                <span className="text-foreground">{scoreBreakdown.location}%</span>
              </div>
              <Progress value={scoreBreakdown.location} className="h-1.5" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Engagement Level</span>
                <span className="text-foreground">{scoreBreakdown.engagement}%</span>
              </div>
              <Progress value={scoreBreakdown.engagement} className="h-1.5" />
            </div>
          </div>
        </Card>

        {/* Contact Info */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-accent" />
            Contact Information
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{lead.phone || "Not provided"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{lead.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{lead.source || "Unknown"}</span>
            </div>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Lead Details */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Home className="h-4 w-4 text-accent" />
            Lead Details
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <DollarSign className="h-4 w-4 mx-auto text-accent mb-1" />
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-sm font-medium text-foreground">{lead.budget || "Not provided"}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <Tag className="h-4 w-4 mx-auto text-accent mb-1" />
              <p className="text-xs text-muted-foreground">Source</p>
              <p className="text-sm font-medium text-foreground">{lead.source}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <Home className="h-4 w-4 mx-auto text-accent mb-1" />
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-medium text-foreground capitalize">{lead.status}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <Calendar className="h-4 w-4 mx-auto text-accent mb-1" />
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm font-medium text-foreground">{new Date(lead.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Activity Timeline */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent" />
            Recent Activity
          </h4>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 border border-accent/20">
                <MessageSquare className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-sm text-foreground">Sent message</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary border border-border">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-foreground">Viewed property listing</p>
                <p className="text-xs text-muted-foreground">15 minutes ago</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary border border-border">
                <Star className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-foreground">Lead qualified by AI</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-4">
          <Button variant="neon" className="w-full" onClick={handleScheduleViewing}>
            Schedule Viewing
          </Button>
          <Button variant="outline" className="w-full" onClick={handleAssignAgent}>
            Assign to Agent
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleViewProfile}>
            View Full Profile
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
