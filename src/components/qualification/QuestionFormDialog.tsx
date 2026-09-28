import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { Question } from "@/lib/store";

interface QuestionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question?: Question | null;
  onSave: (question: Omit<Question, "id">) => void;
  mode: "add" | "edit";
}

const categories = ["Budget", "Timeline", "Financing", "Property Type", "Location", "Requirements", "Experience", "Other"];
const questionTypes = [
  { value: "single", label: "Single Choice" },
  { value: "multiple", label: "Multiple Choice" },
  { value: "text", label: "Text Input" },
  { value: "scale", label: "Scale (1-10)" },
];

export function QuestionFormDialog({
  open,
  onOpenChange,
  question,
  onSave,
  mode,
}: QuestionFormDialogProps) {
  const [formData, setFormData] = useState(() => question && mode === "edit" ? {
    question: question.question, type: question.type, options: question.options || [], weight: question.weight,
    required: question.required, enabled: question.enabled, category: question.category,
  } : { question: "", type: "single" as const, options: [] as string[], weight: 10, required: true, enabled: true, category: "Other" });
  const [newOption, setNewOption] = useState("");

  const handleAddOption = () => {
    if (newOption.trim() && !formData.options.includes(newOption.trim())) {
      setFormData({
        ...formData,
        options: [...formData.options, newOption.trim()],
      });
      setNewOption("");
    }
  };

  const handleRemoveOption = (option: string) => {
    setFormData({
      ...formData,
      options: formData.options.filter((o) => o !== option),
    });
  };

  const handleSubmit = () => {
    if (!formData.question.trim()) return;
    onSave(formData);
    onOpenChange(false);
  };

  const needsOptions = formData.type === "single" || formData.type === "multiple";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Question" : "Edit Question"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="question">Question Text</Label>
            <Input
              id="question"
              placeholder="Enter your question..."
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Question Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "single" | "multiple" | "text" | "scale") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {needsOptions && (
            <div className="space-y-2">
              <Label>Answer Options</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add an option..."
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddOption())}
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddOption}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.options.map((option) => (
                  <Badge
                    key={option}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {option}
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(option)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {formData.options.length === 0 && (
                  <p className="text-sm text-muted-foreground">No options added yet</p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Weight</Label>
              <span className="text-sm font-medium text-foreground">{formData.weight}%</span>
            </div>
            <Slider
              value={[formData.weight]}
              onValueChange={([value]) => setFormData({ ...formData, weight: value })}
              min={5}
              max={50}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              How much this question affects the lead score
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Required</Label>
              <p className="text-xs text-muted-foreground">
                Lead must answer this question
              </p>
            </div>
            <Switch
              checked={formData.required}
              onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enabled</Label>
              <p className="text-xs text-muted-foreground">
                Include in qualification flow
              </p>
            </div>
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.question.trim()}>
            {mode === "add" ? "Add Question" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
