import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GuideCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  duration: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  topics: string[];
}

export function GuideCard({
  title,
  description,
  icon: Icon,
  duration,
  difficulty,
  topics,
}: GuideCardProps) {
  const { toast } = useToast();

  const getDifficultyColor = (level: string): BadgeProps["variant"] => {
    switch (level) {
      case "beginner":
        return "success";
      case "intermediate":
        return "warning";
      case "advanced":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handleClick = () => {
    toast({
      title: "Opening Guide",
      description: `Loading "${title}"...`,
    });
  };

  return (
    <Card 
      variant="glass" 
      className="hover:border-accent/30 transition-all duration-300 group cursor-pointer"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 text-accent group-hover:shadow-neon transition-shadow">
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-medium text-foreground">
              {title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant={getDifficultyColor(difficulty)}
                className="text-[10px] capitalize"
              >
                {difficulty}
              </Badge>
              <span className="text-xs text-muted-foreground">{duration}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <div className="flex flex-wrap gap-1.5">
          {topics.map((topic, index) => (
            <Badge key={index} variant="secondary" className="text-[10px]">
              {topic}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
