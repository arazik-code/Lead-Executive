import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  CheckCircle2,
  MessageSquare,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  description?: string;
}

export function QualificationStats() {
  const stats: StatCardProps[] = [
    {
      title: "Qualification Rate",
      value: "78%",
      change: "+5.2%",
      changeType: "positive",
      icon: <Target className="h-5 w-5" />,
      description: "Leads meeting minimum criteria",
    },
    {
      title: "Avg. Score",
      value: "72.4",
      change: "+3.1",
      changeType: "positive",
      icon: <TrendingUp className="h-5 w-5" />,
      description: "Average qualification score",
    },
    {
      title: "Questions Answered",
      value: "94%",
      change: "+2.8%",
      changeType: "positive",
      icon: <CheckCircle2 className="h-5 w-5" />,
      description: "Completion rate for required questions",
    },
    {
      title: "Hot Leads Generated",
      value: "156",
      change: "+23",
      changeType: "positive",
      icon: <Zap className="h-5 w-5" />,
      description: "This month",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} variant="glass" className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 text-accent">
                {stat.icon}
              </div>
              {stat.change && (
                <Badge
                  variant={stat.changeType === "positive" ? "success" : stat.changeType === "negative" ? "destructive" : "secondary"}
                  className="text-[10px]"
                >
                  {stat.change}
                </Badge>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-display font-bold text-foreground">
                {stat.value}
              </p>
              <p className="text-sm font-medium text-foreground mt-1">
                {stat.title}
              </p>
              {stat.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
