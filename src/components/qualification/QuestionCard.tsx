import { useState } from "react";
import {
  Target,
  Plus,
  Edit3,
  Trash2,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Question {
  id: string;
  question: string;
  type: "single" | "multiple" | "text" | "scale";
  options?: string[];
  weight: number;
  required: boolean;
  enabled: boolean;
  category: string;
}

const mockQuestions: Question[] = [
  {
    id: "1",
    question: "What is your budget range for this property?",
    type: "single",
    options: ["Under $300K", "$300K-$500K", "$500K-$750K", "$750K-$1M", "Over $1M"],
    weight: 25,
    required: true,
    enabled: true,
    category: "Budget",
  },
  {
    id: "2",
    question: "When are you looking to make a purchase?",
    type: "single",
    options: ["Immediately", "Within 30 days", "1-3 months", "3-6 months", "Just browsing"],
    weight: 20,
    required: true,
    enabled: true,
    category: "Timeline",
  },
  {
    id: "3",
    question: "Are you pre-approved for a mortgage?",
    type: "single",
    options: ["Yes, fully pre-approved", "In the process", "Not yet", "Paying cash"],
    weight: 20,
    required: true,
    enabled: true,
    category: "Financing",
  },
  {
    id: "4",
    question: "What type of property are you interested in?",
    type: "multiple",
    options: ["Single Family Home", "Condo/Townhouse", "Multi-Family", "Land/Lot", "Commercial"],
    weight: 10,
    required: true,
    enabled: true,
    category: "Property Type",
  },
  {
    id: "5",
    question: "Which neighborhoods are you considering?",
    type: "text",
    weight: 10,
    required: false,
    enabled: true,
    category: "Location",
  },
  {
    id: "6",
    question: "How many bedrooms do you need?",
    type: "single",
    options: ["1-2", "3", "4", "5+"],
    weight: 5,
    required: true,
    enabled: true,
    category: "Requirements",
  },
  {
    id: "7",
    question: "Have you worked with a real estate agent before?",
    type: "single",
    options: ["Yes, currently have an agent", "Yes, in the past", "No, first time buyer"],
    weight: 10,
    required: false,
    enabled: true,
    category: "Experience",
  },
];

interface QuestionCardProps {
  question: Question;
  onToggle: (id: string) => void;
  onEdit?: (question: Question) => void;
  onDelete?: (id: string) => void;
}

export function QuestionCard({ question, onToggle, onEdit, onDelete }: QuestionCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "single":
        return "Single Choice";
      case "multiple":
        return "Multiple Choice";
      case "text":
        return "Text Input";
      case "scale":
        return "Rating Scale";
      default:
        return type;
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card
        variant="glass"
        className={cn(
          "transition-all duration-300",
          !question.enabled && "opacity-50"
        )}
      >
        <CardHeader className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-2 shrink-0 pt-1">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <Switch
                checked={question.enabled}
                onCheckedChange={() => onToggle(question.id)}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {question.question}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {question.category}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {getTypeLabel(question.type)}
                    </Badge>
                    {question.required && (
                      <Badge variant="destructive" className="text-[10px]">
                        Required
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Weight</p>
                    <p className="text-lg font-display font-bold text-accent">
                      {question.weight}%
                    </p>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0 ml-10">
            {question.options && (
              <div className="space-y-2 mb-4">
                <p className="text-xs text-muted-foreground">Answer Options:</p>
                <div className="flex flex-wrap gap-2">
                  {question.options.map((option, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {option}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => onEdit?.(question)}
              >
                <Edit3 className="mr-1 h-3 w-3" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-destructive hover:text-destructive"
                onClick={() => onDelete?.(question.id)}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
