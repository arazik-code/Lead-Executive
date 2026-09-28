import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, MessageSquare, UserPlus, ArrowUpRight, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "new_lead" | "qualified" | "routed" | "message";
  title: string;
  description: string;
  timestamp: string;
}

const activities: ActivityItem[] = [
  {
    id: "1",
    type: "new_lead",
    title: "New lead captured",
    description: "Ahmed Hassan via WhatsApp",
    timestamp: "2 min ago",
  },
  {
    id: "2",
    type: "qualified",
    title: "Lead qualified",
    description: "Sarah Ali → High Signal (Score: 92)",
    timestamp: "5 min ago",
  },
  {
    id: "3",
    type: "routed",
    title: "Lead routed",
    description: "Omar Khalid → Senior Brokers",
    timestamp: "8 min ago",
  },
  {
    id: "4",
    type: "message",
    title: "Qualification complete",
    description: "Fatima Noor answered all questions",
    timestamp: "12 min ago",
  },
  {
    id: "5",
    type: "new_lead",
    title: "New lead captured",
    description: "Mohammed Yusuf via WhatsApp",
    timestamp: "15 min ago",
  },
];

const iconMap = {
  new_lead: UserPlus,
  qualified: CheckCircle,
  routed: ArrowUpRight,
  message: MessageSquare,
};

const colorMap = {
  new_lead: "text-accent bg-accent/10",
  qualified: "text-success bg-success/10",
  routed: "text-warning bg-warning/10",
  message: "text-muted-foreground bg-secondary",
};

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activities.map((activity) => {
          const Icon = iconMap[activity.type];
          return (
            <div
              key={activity.id}
              className="flex items-start gap-2.5 rounded-md p-2"
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                  colorMap[activity.type]
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{activity.title}</p>
                <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {activity.timestamp}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
