import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, DollarSign, Clock, Home, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface QualificationQuestion {
  id: string;
  question: string;
  icon: React.ElementType;
  completionRate: number;
  responses: number;
}

const questions: QualificationQuestion[] = [
  {
    id: "budget",
    question: "What's your budget range?",
    icon: DollarSign,
    completionRate: 92,
    responses: 46,
  },
  {
    id: "intent",
    question: "Are you ready to purchase?",
    icon: Target,
    completionRate: 88,
    responses: 44,
  },
  {
    id: "timeline",
    question: "When do you plan to buy?",
    icon: Clock,
    completionRate: 78,
    responses: 39,
  },
  {
    id: "property",
    question: "What property type?",
    icon: Home,
    completionRate: 85,
    responses: 43,
  },
  {
    id: "contact",
    question: "Preferred contact method?",
    icon: MessageSquare,
    completionRate: 95,
    responses: 48,
  },
];

export function QualificationProgress() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Target className="h-4 w-4 text-muted-foreground" />
          Qualification Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {questions.map((q) => (
          <div key={q.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <q.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-foreground text-xs">{q.question}</span>
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  q.completionRate >= 90
                    ? "text-success"
                    : q.completionRate >= 70
                    ? "text-warning"
                    : "text-muted-foreground"
                )}
              >
                {q.completionRate}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Progress
                value={q.completionRate}
                className="h-1.5 flex-1"
              />
              <span className="text-[10px] text-muted-foreground w-16">
                {q.responses} responses
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
