import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  MoreVertical,
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Users,
  MessageSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Agent {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  status: "available" | "busy" | "offline";
  specialty: string[];
  activeLeads: number;
  maxLeads: number;
  rating: number;
  conversionRate: number;
  responseTime: string;
  totalDeals: number;
  region: string;
}

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const { toast } = useToast();

  const handleViewProfile = () => {
    toast({
      title: "View Profile",
      description: `Opening ${agent.name}'s profile...`,
    });
  };

  const handleEditSettings = () => {
    toast({
      title: "Edit Settings",
      description: `Opening settings for ${agent.name}...`,
    });
  };

  const handleViewPerformance = () => {
    toast({
      title: "Performance",
      description: `Loading performance metrics for ${agent.name}...`,
    });
  };

  const handleDeactivate = () => {
    toast({
      title: "Agent Deactivated",
      description: `${agent.name} has been deactivated`,
      variant: "destructive",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-success";
      case "busy":
        return "bg-warning";
      default:
        return "bg-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Available";
      case "busy":
        return "Busy";
      default:
        return "Offline";
    }
  };

  const loadPercentage = (agent.activeLeads / agent.maxLeads) * 100;

  return (
    <Card variant="glass" className="hover:border-accent/30 transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-14 w-14 border-2 border-border">
              <AvatarImage src={agent.avatar} />
              <AvatarFallback className="bg-secondary text-foreground font-display">
                {agent.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div
              className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card ${getStatusColor(
                agent.status
              )}`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium text-foreground">{agent.name}</h3>
                <p className="text-sm text-muted-foreground">{agent.role}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    agent.status === "available"
                      ? "success"
                      : agent.status === "busy"
                      ? "warning"
                      : "secondary"
                  }
                  className="text-[10px]"
                >
                  {getStatusLabel(agent.status)}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleViewProfile}>View Profile</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleEditSettings}>Edit Settings</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleViewPerformance}>View Performance</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={handleDeactivate}>
                      Deactivate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Specialties */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {agent.specialty.map((spec, index) => (
                <Badge key={index} variant="secondary" className="text-[10px]">
                  {spec}
                </Badge>
              ))}
            </div>

            {/* Lead Load */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Lead Capacity</span>
                <span className="text-foreground font-medium">
                  {agent.activeLeads}/{agent.maxLeads}
                </span>
              </div>
              <Progress
                value={loadPercentage}
                className="h-2"
              />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-accent mb-1">
                  <Star className="h-3 w-3" />
                  <span className="text-sm font-semibold">{agent.rating}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Rating</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-success mb-1">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-sm font-semibold">{agent.conversionRate}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Conversion</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-foreground mb-1">
                  <span className="text-sm font-semibold">{agent.responseTime}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Response</p>
              </div>
            </div>

            {/* Region */}
            <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{agent.region}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
