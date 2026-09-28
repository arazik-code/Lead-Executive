import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ContactCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  actionVariant?: "default" | "neon" | "outline";
  availability?: string;
  responseTime?: string;
}

export function ContactCard({
  title,
  description,
  icon,
  action,
  actionVariant = "outline",
  availability,
  responseTime,
}: ContactCardProps) {
  const { toast } = useToast();

  const handleClick = () => {
    toast({
      title: title,
      description: `Initiating ${action.toLowerCase()}...`,
    });
  };

  return (
    <Card variant="glass" className="hover:border-accent/30 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 text-accent shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
            {(availability || responseTime) && (
              <div className="flex items-center gap-3 mt-3">
                {availability && (
                  <span className="text-xs text-muted-foreground">
                    {availability}
                  </span>
                )}
                {responseTime && (
                  <Badge variant="secondary" className="text-[10px]">
                    {responseTime}
                  </Badge>
                )}
              </div>
            )}
            <Button
              variant={actionVariant}
              size="sm"
              className="mt-4"
              onClick={handleClick}
            >
              {action}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
