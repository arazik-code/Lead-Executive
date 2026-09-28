import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { useLeads } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

const dailyLeads = [
  { day: "Day 1", leads: 4, qualified: 3, highSignal: 1 },
  { day: "Day 2", leads: 7, qualified: 5, highSignal: 2 },
  { day: "Day 3", leads: 5, qualified: 4, highSignal: 1 },
  { day: "Day 4", leads: 9, qualified: 7, highSignal: 3 },
  { day: "Day 5", leads: 6, qualified: 5, highSignal: 2 },
  { day: "Day 6", leads: 11, qualified: 9, highSignal: 4 },
  { day: "Day 7", leads: 8, qualified: 7, highSignal: 3 },
];

const routingData = [
  { name: "Senior Brokers", value: 12, color: "hsl(160, 84%, 39%)" },
  { name: "Junior Team", value: 28, color: "hsl(38, 92%, 50%)" },
  { name: "Nurture Queue", value: 15, color: "hsl(220, 15%, 55%)" },
];

const qualificationData = [
  { question: "Budget", rate: 92 },
  { question: "Intent", rate: 88 },
  { question: "Timeline", rate: 78 },
  { question: "Property", rate: 85 },
  { question: "Contact", rate: 95 },
];

export default function Analytics() {
  const [dateRange, setDateRange] = useState("7d");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { leads } = useLeads();
  const { toast } = useToast();

  // Calculate real metrics from leads
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => l.status === "Qualified" || l.status === "Routed").length;
  const qualificationRate = totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : "0";
  const highSignalLeads = leads.filter(l => l.score >= 80).length;
  const highSignalRate = totalLeads > 0 ? ((highSignalLeads / totalLeads) * 100).toFixed(1) : "0";

  const dynamicMetrics = [
    {
      title: "Qualification Rate",
      value: `${qualificationRate}%`,
      change: "+8.3%",
      trend: "up" as "up" | "down",
      icon: Target,
      color: "success",
    },
    {
      title: "High Signal Rate",
      value: `${highSignalRate}%`,
      change: "+5.2%",
      trend: "up" as "up" | "down",
      icon: TrendingUp,
      color: "accent",
    },
    {
      title: "Avg. Response Time",
      value: "< 2 min",
      change: "-45%",
      trend: "up" as const,
      icon: Clock,
      color: "warning",
    },
    {
      title: "Total Leads",
      value: totalLeads.toString(),
      change: `${qualifiedLeads} qualified`,
      trend: "neutral" as const,
      icon: CheckCircle,
      color: "primary",
    },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Data refreshed",
        description: "Analytics data has been updated.",
      });
    }, 1000);
  };

  const handleExport = () => {
    const data = {
      metrics: dynamicMetrics,
      dateRange,
      exportedAt: new Date().toISOString(),
      dailyLeads,
      routingData,
      qualificationData,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-report-${dateRange}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Export complete",
      description: "Analytics report downloaded successfully.",
    });
  };

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Performance metrics and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="default" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {dynamicMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{metric.title}</p>
                    <p className="text-2xl font-semibold text-foreground">{metric.value}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      {metric.trend === "up" && (
                        <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                      )}
                      {metric.trend === "down" && (
                        <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                      )}
                      <span
                        className={cn(
                          "text-xs",
                          metric.trend === "up" && "text-success",
                          metric.trend === "down" && "text-destructive",
                          metric.trend === "neutral" && "text-muted-foreground"
                        )}
                      >
                        {metric.change}
                      </span>
                    </div>
                  </div>
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", `bg-${metric.color}/10`)}>
                    <Icon className={cn("h-5 w-5", `text-${metric.color}`)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Lead Volume Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Lead Volume Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyLeads}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorQualified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "hsl(210, 15%, 55%)", fontSize: 12 }} axisLine={{ stroke: "hsl(220, 15%, 20%)" }} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(210, 15%, 55%)", fontSize: 12 }} axisLine={{ stroke: "hsl(220, 15%, 20%)" }} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220, 20%, 10%)",
                      border: "1px solid hsl(220, 15%, 20%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Area type="monotone" dataKey="leads" stroke="hsl(187, 100%, 50%)" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" name="Total Leads" />
                  <Area type="monotone" dataKey="qualified" stroke="hsl(160, 84%, 39%)" strokeWidth={2} fillOpacity={1} fill="url(#colorQualified)" name="Qualified" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Routing Distribution */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Routing Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={routingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {routingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220, 20%, 10%)",
                      border: "1px solid hsl(220, 15%, 20%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend
                    formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Qualification Rates */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Question Completion Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualificationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(210, 15%, 55%)", fontSize: 12 }} axisLine={{ stroke: "hsl(220, 15%, 20%)" }} tickLine={false} />
                <YAxis dataKey="question" type="category" tick={{ fill: "hsl(210, 15%, 55%)", fontSize: 12 }} axisLine={{ stroke: "hsl(220, 15%, 20%)" }} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220, 20%, 10%)",
                    border: "1px solid hsl(220, 15%, 20%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value}%`, "Completion Rate"]}
                />
                <Bar dataKey="rate" fill="hsl(187, 100%, 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
