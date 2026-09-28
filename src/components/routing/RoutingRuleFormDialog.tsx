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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { RoutingRule, useApp } from "@/lib/store";

type RoutingRuleCondition = {
  type: string;
  operator: string;
  value: string;
};

interface RoutingRuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: RoutingRule | null;
  onSave: (rule: Omit<RoutingRule, "id" | "matchCount">) => void;
  mode: "add" | "edit";
}

const conditionTypes = [
  { value: "Lead Score", label: "Lead Score" },
  { value: "Budget", label: "Budget" },
  { value: "Location", label: "Location" },
  { value: "Property Type", label: "Property Type" },
  { value: "Timeline", label: "Timeline" },
  { value: "Experience", label: "Experience" },
  { value: "Financing", label: "Financing" },
];

const operators = [
  { value: "equals", label: "equals" },
  { value: "greater than", label: "greater than" },
  { value: "less than", label: "less than" },
  { value: "contains", label: "contains" },
];

const actionTypes = [
  { value: "assign", label: "Assign to" },
  { value: "queue", label: "Add to Queue" },
  { value: "rotate", label: "Round-robin to" },
];

export function RoutingRuleFormDialog({
  open,
  onOpenChange,
  rule,
  onSave,
  mode,
}: RoutingRuleFormDialogProps) {
  const { state } = useApp();
  const agents = state.agents;
  
  const [formData, setFormData] = useState(() => rule && mode === "edit" ? {
    name: rule.name, description: rule.description || "", conditions: rule.conditions, action: rule.action,
    priority: rule.priority, enabled: rule.enabled,
  } : { name: "", description: "", conditions: [] as RoutingRuleCondition[], action: { type: "assign" as const, target: agents[0]?.name || "" }, priority: 1, enabled: true });
  
  const [conditionType, setConditionType] = useState("Lead Score");
  const [conditionOperator, setConditionOperator] = useState("equals");
  const [conditionValue, setConditionValue] = useState("");


  const handleAddCondition = () => {
    if (conditionValue.trim()) {
      const newCondition: RoutingRuleCondition = {
        type: conditionType,
        operator: conditionOperator,
        value: conditionValue.trim(),
      };
      setFormData({
        ...formData,
        conditions: [...formData.conditions, newCondition],
      });
      setConditionValue("");
    }
  };

  const handleRemoveCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || formData.conditions.length === 0) return;
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Routing Rule" : "Edit Routing Rule"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              placeholder="e.g., High-Value Luxury Leads"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this rule does..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                min={1}
                max={10}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground">
                Lower number = higher priority
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="actionType">Action Type</Label>
              <Select
                value={formData.action.type}
                onValueChange={(value: "assign" | "queue" | "rotate") => 
                  setFormData({ ...formData, action: { ...formData.action, type: value } })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">Target (Team/Agent)</Label>
            <Input
              id="target"
              placeholder="e.g., Senior Agent Pool, VIP Team"
              value={formData.action.target}
              onChange={(e) => setFormData({ ...formData, action: { ...formData.action, target: e.target.value } })}
            />
          </div>

          <div className="space-y-2">
            <Label>Conditions</Label>
            <div className="flex gap-2">
              <Select value={conditionType} onValueChange={setConditionType}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conditionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={conditionOperator} onValueChange={setConditionOperator}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Value..."
                value={conditionValue}
                onChange={(e) => setConditionValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCondition())}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddCondition}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 mt-2">
              {formData.conditions.map((condition, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border"
                >
                  <Badge variant="outline" className="text-xs">{condition.type}</Badge>
                  <span className="text-xs text-muted-foreground">{condition.operator}</span>
                  <Badge variant="secondary" className="text-xs">{condition.value}</Badge>
                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(index)}
                    className="ml-auto rounded-full p-1 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {formData.conditions.length === 0 && (
                <p className="text-sm text-muted-foreground">No conditions added yet</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enabled</Label>
              <p className="text-xs text-muted-foreground">
                Rule will be active immediately
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
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.name.trim() || formData.conditions.length === 0}
          >
            {mode === "add" ? "Add Rule" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
