import { Users, MessageSquare, Target, TrendingUp, Inbox, CheckCircle, Clock } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { LeadCard } from "@/components/dashboard/LeadCard";
import { PipelineStage } from "@/components/dashboard/PipelineStage";
import { RoutingCard } from "@/components/dashboard/RoutingCard";
import { QualificationProgress } from "@/components/dashboard/QualificationProgress";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { LeadChart } from "@/components/dashboard/LeadChart";
import { Badge } from "@/components/ui/badge";
import { useLeads, useMessages } from "@/lib/store";

export default function Index() {
  const { leads } = useLeads();
  const { conversations } = useMessages();

  // Calculate real metrics
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => l.status === "Qualified" || l.status === "Routed").length;
  const qualificationRate = totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : "0";
  const highSignalLeads = leads.filter(l => l.score >= 80).length;
  const unreadMessages = conversations.filter(c => c.unread > 0).length;

  // Group leads by status for pipeline
  const newLeads = leads.filter(l => l.status === "New").slice(0, 3);
  const qualifyingLeads = leads.filter(l => l.status === "Qualifying").slice(0, 3);
  const qualifiedLeadsList = leads.filter(l => l.status === "Qualified").slice(0, 3);

  // Recent leads (sorted by score for demo)
  const recentLeads = [...leads]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(lead => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      budget: lead.budget,
      intent: lead.intent.charAt(0).toUpperCase() + lead.intent.slice(1) as "High" | "Medium" | "Low",
      timeline: lead.timeline,
      propertyType: lead.propertyType,
      source: lead.source,
      timestamp: "Recent",
      score: lead.score,
    }));
  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lead qualification and routing overview
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <MetricCard
          title="Total Leads"
          value={totalLeads.toString()}
          change="+12% vs last week"
          changeType="positive"
          icon={Users}
          iconColor="cyan"
        />
        <MetricCard
          title="Qualified Leads"
          value={qualifiedLeads.toString()}
          change={`${qualificationRate}% qualification rate`}
          changeType="positive"
          icon={Target}
          iconColor="green"
        />
        <MetricCard
          title="High Signal"
          value={highSignalLeads.toString()}
          change="Routed to Senior Brokers"
          changeType="neutral"
          icon={TrendingUp}
          iconColor="silver"
        />
        <MetricCard
          title="Unread Messages"
          value={unreadMessages.toString()}
          change="Pending response"
          changeType={unreadMessages > 0 ? "negative" : "positive"}
          icon={MessageSquare}
          iconColor="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        {/* Pipeline View */}
        <div className="lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-3">
            <PipelineStage
              title="New"
              count={newLeads.length}
              icon={<Inbox className="h-4 w-4 text-accent" />}
              variant="default"
            >
              {newLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between rounded-md bg-secondary/50 p-2.5 border border-border"
                >
                  <span className="text-sm">{lead.name}</span>
                  <Badge variant="secondary">{lead.score}</Badge>
                </div>
              ))}
              {newLeads.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-2">No new leads</div>
              )}
            </PipelineStage>

            <PipelineStage
              title="Qualifying"
              count={qualifyingLeads.length}
              icon={<Clock className="h-4 w-4 text-warning" />}
              variant="warning"
            >
              {qualifyingLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between rounded-md bg-secondary/50 p-2.5 border border-border"
                >
                  <span className="text-sm">{lead.name}</span>
                  <Badge variant="warning">{lead.score}</Badge>
                </div>
              ))}
              {qualifyingLeads.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-2">No leads qualifying</div>
              )}
            </PipelineStage>

            <PipelineStage
              title="Qualified"
              count={qualifiedLeadsList.length}
              icon={<CheckCircle className="h-4 w-4 text-success" />}
              variant="success"
            >
              {qualifiedLeadsList.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between rounded-md bg-secondary/50 p-2.5 border border-border"
                >
                  <span className="text-sm">{lead.name}</span>
                  <Badge variant="success">{lead.score}</Badge>
                </div>
              ))}
              {qualifiedLeadsList.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-2">No qualified leads</div>
              )}
            </PipelineStage>
          </div>
        </div>

        {/* Activity Feed */}
        <ActivityFeed />
      </div>

      {/* Charts and Details */}
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <LeadChart />
        <QualificationProgress />
      </div>

      {/* Routing & Recent Leads */}
      <div className="grid gap-4 lg:grid-cols-3">
        <RoutingCard />
        
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-base font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Recent Leads
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {recentLeads.length > 0 ? (
              recentLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No leads yet. Add your first lead from the Leads page.
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
