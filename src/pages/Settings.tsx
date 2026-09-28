import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import {
  Settings as SettingsIcon,
  Bell,
  MessageSquare,
  Shield,
  Zap,
  Save,
  RefreshCw,
} from "lucide-react";

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();

  const [localSettings, setLocalSettings] = useState(settings);

  const [questions, setQuestions] = useState([
    { id: 1, question: "What's your budget range?", enabled: true },
    { id: 2, question: "Are you ready to purchase?", enabled: true },
    { id: 3, question: "When do you plan to buy?", enabled: true },
    { id: 4, question: "What property type?", enabled: true },
    { id: 5, question: "Preferred contact method?", enabled: false },
  ]);

  const handleSave = () => {
    updateSettings(localSettings);
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully.",
    });
  };

  const handleReset = () => {
    setLocalSettings(settings);
    toast({
      title: "Settings Reset",
      description: "Settings have been reset to last saved values.",
    });
  };

  const toggleQuestion = (id: number) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, enabled: !q.enabled } : q)));
  };

  const toggleNotification = (key: keyof typeof localSettings.notifications) => {
    setLocalSettings({
      ...localSettings,
      notifications: {
        ...localSettings.notifications,
        [key]: !localSettings.notifications[key],
      },
    });
  };
  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure system settings
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pilot Configuration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Zap className="h-4 w-4 text-muted-foreground" />
              Configuration
            </CardTitle>
            <CardDescription>Manage settings and duration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground text-sm">Status</Label>
                <p className="text-xs text-muted-foreground">System is {localSettings.systemActive ? "active" : "inactive"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={localSettings.systemActive ? "success" : "secondary"}>{localSettings.systemActive ? "Active" : "Inactive"}</Badge>
                <Switch checked={localSettings.systemActive} onCheckedChange={(checked) => setLocalSettings({ ...localSettings, systemActive: checked })} />
              </div>
            </div>
            <Separator className="bg-border" />
            <div className="space-y-1.5">
              <Label htmlFor="duration" className="text-sm">Duration (days)</Label>
              <Input id="duration" type="number" value={localSettings.pilotDuration} onChange={(e) => setLocalSettings({ ...localSettings, pilotDuration: parseInt(e.target.value) || 14 })} className="bg-secondary/50 h-9" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="entry" className="text-sm">WhatsApp Entry Point</Label>
              <Input id="entry" value={localSettings.whatsappEntry} onChange={(e) => setLocalSettings({ ...localSettings, whatsappEntry: e.target.value })} className="bg-secondary/50 h-9" />
            </div>
          </CardContent>
        </Card>

        {/* Qualification Questions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Qualification Questions
            </CardTitle>
            <CardDescription>Configure structured questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {questions.map((q) => (
              <div key={q.id} className="flex items-center justify-between rounded-md border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="w-5 h-5 flex items-center justify-center p-0 text-xs">
                    {q.id}
                  </Badge>
                  <span className="text-xs text-foreground">{q.question}</span>
                </div>
                <Switch checked={q.enabled} onCheckedChange={() => toggleQuestion(q.id)} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Routing Rules */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Routing Rules
            </CardTitle>
            <CardDescription>Define lead routing by signal strength</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">High Signal Threshold</Label>
              <div className="flex items-center gap-2">
                <Input type="number" value={localSettings.highSignalThreshold} onChange={(e) => setLocalSettings({ ...localSettings, highSignalThreshold: parseInt(e.target.value) || 80 })} className="bg-secondary/50 w-16 h-8 text-sm" />
                <span className="text-xs text-muted-foreground">and above → Senior Brokers</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Medium Signal Range</Label>
              <div className="flex items-center gap-2">
                <Input type="number" value={localSettings.mediumSignalMin} onChange={(e) => setLocalSettings({ ...localSettings, mediumSignalMin: parseInt(e.target.value) || 50 })} className="bg-secondary/50 w-16 h-8 text-sm" />
                <span className="text-muted-foreground text-xs">-</span>
                <Input type="number" value={localSettings.mediumSignalMax} onChange={(e) => setLocalSettings({ ...localSettings, mediumSignalMax: parseInt(e.target.value) || 79 })} className="bg-secondary/50 w-16 h-8 text-sm" />
                <span className="text-xs text-muted-foreground">→ Junior Team</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Low Signal</Label>
              <span className="text-xs text-muted-foreground">Below {localSettings.mediumSignalMin} → Nurture Queue</span>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Bell className="h-4 w-4 text-muted-foreground" />
              Notifications
            </CardTitle>
            <CardDescription>Manage notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: "newLeadAlerts" as const, label: "New lead alerts", description: "Notify on new leads" },
              { key: "highSignalAlerts" as const, label: "High signal alerts", description: "Alert for high-value leads" },
              { key: "dailySummary" as const, label: "Daily summary", description: "Daily performance summary" },
              { key: "milestoneAlerts" as const, label: "Milestone alerts", description: "Notify at milestones" },
            ].map((setting) => (
              <div key={setting.key} className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground text-sm">{setting.label}</Label>
                  <p className="text-[10px] text-muted-foreground">{setting.description}</p>
                </div>
                <Switch checked={localSettings.notifications[setting.key]} onCheckedChange={() => toggleNotification(setting.key)} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReset}>
          <RefreshCw className="h-3.5 w-3.5" />
          Reset
        </Button>
        <Button variant="default" size="sm" className="gap-1.5" onClick={handleSave}>
          <Save className="h-3.5 w-3.5" />
          Save Changes
        </Button>
      </div>
    </MainLayout>
  );
}
