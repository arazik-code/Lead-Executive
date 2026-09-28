import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentCard } from "@/components/routing/AgentCard";
import { RoutingRuleCard, mockRules } from "@/components/routing/RoutingRuleCard";
import { RoutingRuleFormDialog } from "@/components/routing/RoutingRuleFormDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Users,
  Settings2,
  ArrowRight,
  TrendingUp,
  Clock,
  Zap,
  Target,
  BarChart3,
} from "lucide-react";
import { useRoutingRules, useApp, RoutingRule } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

export default function Routing() {
  const [rules, setRules] = useState(mockRules);
  const [activeTab, setActiveTab] = useState("agents");
  const { state } = useApp();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [ruleDialogMode, setRuleDialogMode] = useState<"add" | "edit">("add");
  const [selectedRule, setSelectedRule] = useState<typeof rules[0] | null>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [routingSettings, setRoutingSettings] = useState({
    autoAssign: true,
    roundRobinEnabled: true,
    maxLeadsPerAgent: 15,
    fallbackBehavior: "queue",
    prioritizeHighScore: true,
  });
  const agents = state.agents;

  const handleToggleRule = (id: string) => {
    setRules(
      rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
    const rule = rules.find(r => r.id === id);
    toast({
      title: rule?.enabled ? "Rule disabled" : "Rule enabled",
      description: `${rule?.name} has been ${rule?.enabled ? "disabled" : "enabled"}.`,
    });
  };

  const handleEditRule = (rule: typeof rules[0]) => {
    setSelectedRule(rule);
    setRuleDialogMode("edit");
    setRuleDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setRuleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (ruleToDelete) {
      setRules(rules.filter(r => r.id !== ruleToDelete));
      toast({
        title: "Rule deleted",
        description: "The routing rule has been removed.",
      });
    }
    setDeleteDialogOpen(false);
    setRuleToDelete(null);
  };

  const handleAddRule = () => {
    setSelectedRule(null);
    setRuleDialogMode("add");
    setRuleDialogOpen(true);
  };

  const handleSaveRule = (ruleData: Omit<RoutingRule, "id" | "matchCount">) => {
    if (ruleDialogMode === "add") {
      const newRule = {
        ...ruleData,
        id: `rule-${Date.now()}`,
        matchCount: 0,
      };
      setRules([...rules, newRule]);
      toast({
        title: "Rule created",
        description: `"${ruleData.name}" has been added.`,
      });
    } else if (selectedRule) {
      setRules(rules.map(r => 
        r.id === selectedRule.id 
          ? { ...r, ...ruleData }
          : r
      ));
      toast({
        title: "Rule updated",
        description: `"${ruleData.name}" has been updated.`,
      });
    }
    setRuleDialogOpen(false);
  };

  const handleConfigureFallback = () => {
    setSettingsDialogOpen(true);
  };

  const handleSettings = () => {
    setSettingsDialogOpen(true);
  };

  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Routing settings have been updated.",
    });
    setSettingsDialogOpen(false);
  };

  const availableAgents = agents.filter((a) => a.status === "available").length;
  const busyAgents = agents.filter((a) => a.status === "busy").length;
  const activeRules = rules.filter((r) => r.enabled).length;

  return (
    <MainLayout>
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Routing
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure lead assignment rules and manage agent capacity
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSettings}>
              <Settings2 className="mr-1.5 h-3.5 w-3.5" />
              Settings
            </Button>
            <Button variant="default" size="sm" onClick={handleAddRule}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Rule
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success">
                  <Users className="h-4 w-4" />
                </div>
                <Badge variant="success" className="text-[10px]">
                  Active
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-xl font-semibold text-foreground">
                  {availableAgents}
                </p>
                <p className="text-sm text-muted-foreground">
                  Available Agents
                </p>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 border border-warning/20 text-warning">
                  <Clock className="h-5 w-5" />
                </div>
                <Badge variant="warning" className="text-[10px]">
                  At Capacity
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-display font-bold text-foreground">
                  {busyAgents}
                </p>
                <p className="text-sm text-muted-foreground">Busy Agents</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 text-accent">
                  <Zap className="h-5 w-5" />
                </div>
                <Badge variant="neon" className="text-[10px]">
                  Live
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-display font-bold text-foreground">
                  {activeRules}
                </p>
                <p className="text-sm text-muted-foreground">Active Rules</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-purple/10 border border-neon-purple/20 text-neon-purple">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  +12%
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-display font-bold text-foreground">
                  4.2m
                </p>
                <p className="text-sm text-muted-foreground">Avg Response</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="agents" className="data-[state=active]:bg-accent/10 data-[state=active]:text-accent">
              <Users className="mr-2 h-4 w-4" />
              Agents ({agents.length})
            </TabsTrigger>
            <TabsTrigger value="rules" className="data-[state=active]:bg-accent/10 data-[state=active]:text-accent">
              <Target className="mr-2 h-4 w-4" />
              Routing Rules ({rules.length})
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-accent/10 data-[state=active]:text-accent">
              <BarChart3 className="mr-2 h-4 w-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rules" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {rules.map((rule) => (
                  <RoutingRuleCard
                    key={rule.id}
                    rule={rule}
                    onToggle={handleToggleRule}
                    onEdit={handleEditRule}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <Card variant="glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Zap className="h-5 w-5 text-accent" />
                      Routing Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Rules are evaluated in priority order. First matching rule
                      is applied.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                        <span className="text-sm text-foreground">
                          Leads Routed Today
                        </span>
                        <Badge variant="neon">47</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                        <span className="text-sm text-foreground">
                          Avg. Assignment Time
                        </span>
                        <Badge variant="success">2.3s</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                        <span className="text-sm text-foreground">
                          Unmatched Leads
                        </span>
                        <Badge variant="warning">3</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ArrowRight className="h-5 w-5 text-accent" />
                      Fallback Rule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      When no rules match, leads are assigned using round-robin
                      to all available agents.
                    </p>
                    <Button variant="outline" size="sm" className="w-full" onClick={handleConfigureFallback}>
                      Configure Fallback
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="text-base">Agent Leaderboard</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {agents
                    .sort((a, b) => b.conversionRate - a.conversionRate)
                    .slice(0, 5)
                    .map((agent, index) => (
                      <div
                        key={agent.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-display font-bold">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {agent.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {agent.totalDeals} deals
                          </p>
                        </div>
                        <Badge variant="success" className="text-[10px]">
                          {agent.conversionRate}%
                        </Badge>
                      </div>
                    ))}
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="text-base">Rule Effectiveness</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rules
                    .filter((r) => r.enabled)
                    .sort((a, b) => b.matchCount - a.matchCount)
                    .slice(0, 5)
                    .map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-secondary border border-border text-foreground text-xs font-display font-bold">
                          {rule.priority}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {rule.name}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {rule.matchCount} matches
                        </Badge>
                      </div>
                    ))}
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="text-base">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border text-center">
                    <p className="text-3xl font-display font-bold text-accent">
                      98.2%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Auto-Assignment Rate
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border text-center">
                    <p className="text-3xl font-display font-bold text-success">
                      2.1s
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Avg Processing Time
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Routing Rule</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this routing rule? This action cannot be undone
                and may affect how leads are assigned.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add/Edit Rule Dialog */}
        <RoutingRuleFormDialog
          key={`${ruleDialogOpen}-${ruleDialogMode}-${selectedRule?.id ?? "new"}`}
          open={ruleDialogOpen}
          onOpenChange={setRuleDialogOpen}
          rule={selectedRule}
          onSave={handleSaveRule}
          mode={ruleDialogMode}
        />

        {/* Settings Dialog */}
        <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Routing Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-assign leads</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically assign leads when qualified
                  </p>
                </div>
                <Switch
                  checked={routingSettings.autoAssign}
                  onCheckedChange={(checked) =>
                    setRoutingSettings({ ...routingSettings, autoAssign: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Round-robin distribution</Label>
                  <p className="text-xs text-muted-foreground">
                    Distribute leads evenly among agents
                  </p>
                </div>
                <Switch
                  checked={routingSettings.roundRobinEnabled}
                  onCheckedChange={(checked) =>
                    setRoutingSettings({ ...routingSettings, roundRobinEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Prioritize high-score leads</Label>
                  <p className="text-xs text-muted-foreground">
                    Route high-score leads to top performers
                  </p>
                </div>
                <Switch
                  checked={routingSettings.prioritizeHighScore}
                  onCheckedChange={(checked) =>
                    setRoutingSettings({ ...routingSettings, prioritizeHighScore: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Max leads per agent: {routingSettings.maxLeadsPerAgent}</Label>
                <Slider
                  value={[routingSettings.maxLeadsPerAgent]}
                  onValueChange={([value]) =>
                    setRoutingSettings({ ...routingSettings, maxLeadsPerAgent: value })
                  }
                  min={5}
                  max={30}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Fallback behavior</Label>
                <Select
                  value={routingSettings.fallbackBehavior}
                  onValueChange={(value) =>
                    setRoutingSettings({ ...routingSettings, fallbackBehavior: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="queue">Add to queue</SelectItem>
                    <SelectItem value="roundrobin">Round-robin assign</SelectItem>
                    <SelectItem value="notify">Notify manager</SelectItem>
                    <SelectItem value="hold">Hold for review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSettings}>Save Settings</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
