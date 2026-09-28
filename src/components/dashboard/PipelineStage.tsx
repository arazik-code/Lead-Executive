import { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PipelineStageProps {
  title: string;
  count: number;
  icon: ReactNode;
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "muted";
}

const badgeVariants = {
  default: "neon",
  success: "success",
  warning: "warning",
  muted: "secondary",
} as const;

export function PipelineStage({
  title,
  count,
  icon,
  children,
  variant = "default",
}: PipelineStageProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <Badge variant={badgeVariants[variant]}>{count}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4 max-h-[400px] overflow-y-auto">
        {children}
      </CardContent>
    </Card>
  );
}
