import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export interface LeadFilters {
  status: string[];
  intent: string[];
  scoreRange: [number, number];
  propertyTypes: string[];
}

interface LeadFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: LeadFilters;
  onApply: (filters: LeadFilters) => void;
}

export function LeadFilterDialog({
  open,
  onOpenChange,
  filters,
  onApply,
}: LeadFilterDialogProps) {
  const [localFilters, setLocalFilters] = useState<LeadFilters>(filters);

  const statusOptions = ["New", "Qualifying", "Qualified", "Routed"];
  const intentOptions = ["High", "Medium", "Low"];
  const propertyOptions = ["Villa", "Apartment", "Penthouse", "Townhouse", "Studio", "TBD"];

  const toggleArrayItem = (arr: string[], item: string) => {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  };

  const handleApply = () => {
    onApply(localFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    const resetFilters: LeadFilters = {
      status: [],
      intent: [],
      scoreRange: [0, 100],
      propertyTypes: [],
    };
    setLocalFilters(resetFilters);
  };

  const activeFilterCount =
    localFilters.status.length +
    localFilters.intent.length +
    localFilters.propertyTypes.length +
    (localFilters.scoreRange[0] > 0 || localFilters.scoreRange[1] < 100 ? 1 : 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Filter Leads
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount} active
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Apply filters to narrow down your lead list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Status</Label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={localFilters.status.includes(status)}
                    onCheckedChange={() =>
                      setLocalFilters({
                        ...localFilters,
                        status: toggleArrayItem(localFilters.status, status),
                      })
                    }
                  />
                  <label
                    htmlFor={`status-${status}`}
                    className="text-sm cursor-pointer"
                  >
                    {status}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Intent Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Intent Level</Label>
            <div className="flex flex-wrap gap-2">
              {intentOptions.map((intent) => (
                <div key={intent} className="flex items-center space-x-2">
                  <Checkbox
                    id={`intent-${intent}`}
                    checked={localFilters.intent.includes(intent)}
                    onCheckedChange={() =>
                      setLocalFilters({
                        ...localFilters,
                        intent: toggleArrayItem(localFilters.intent, intent),
                      })
                    }
                  />
                  <label
                    htmlFor={`intent-${intent}`}
                    className="text-sm cursor-pointer"
                  >
                    {intent}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Score Range Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Score Range</Label>
              <span className="text-sm text-muted-foreground">
                {localFilters.scoreRange[0]} - {localFilters.scoreRange[1]}
              </span>
            </div>
            <Slider
              value={localFilters.scoreRange}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  scoreRange: value as [number, number],
                })
              }
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Property Type Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Property Type</Label>
            <div className="flex flex-wrap gap-2">
              {propertyOptions.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`property-${type}`}
                    checked={localFilters.propertyTypes.includes(type)}
                    onCheckedChange={() =>
                      setLocalFilters({
                        ...localFilters,
                        propertyTypes: toggleArrayItem(localFilters.propertyTypes, type),
                      })
                    }
                  />
                  <label
                    htmlFor={`property-${type}`}
                    className="text-sm cursor-pointer"
                  >
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="ghost" onClick={handleReset}>
            Reset All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>Apply Filters</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
