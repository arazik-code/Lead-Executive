import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title: string;
  items: FAQItem[];
}

export function FAQSection({ title, items }: FAQSectionProps) {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold text-foreground">
        {title}
      </h3>
      <div className="space-y-2">
        {items.map((item, index) => (
          <Collapsible
            key={index}
            open={openItems.includes(index)}
            onOpenChange={() => toggleItem(index)}
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-secondary/50 p-4 text-left transition-all hover:bg-secondary">
              <span className="text-sm font-medium text-foreground">
                {item.question}
              </span>
              {openItems.includes(index) ? (
                <ChevronDown className="h-4 w-4 text-accent shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <p className="text-sm text-muted-foreground pt-3 leading-relaxed">
                {item.answer}
              </p>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
