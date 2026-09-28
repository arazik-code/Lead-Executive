import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Inbox, MoveUpRight, Users } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { MainLayout } from '@/components/layout/MainLayout';
import { Badge } from '@/components/ui/badge';

interface DashboardData {
  metrics: { total: number; created_last_7_days: number; qualified_or_beyond: number; won: number; scored: number };
  stages: { status: string; count: number }[];
  messaging: { unread_conversations: number; unread_messages: number };
  recentLeads: { id: string; name: string; status: string; score: number | null; source: string; createdAt: string; budgetAmount: string | null; budgetCurrency: string | null }[];
  recentActivity: { eventType: string; entityId: string; createdAt: string; actorName: string | null; payload: Record<string, unknown> }[];
}

const stageTone: Record<string, string> = {
  new: 'bg-sky-500', qualifying: 'bg-amber-500', qualified: 'bg-orange-500', assigned: 'bg-violet-500',
  contacted: 'bg-indigo-500', meeting_scheduled: 'bg-cyan-500', nurture: 'bg-slate-400', won: 'bg-emerald-600', lost: 'bg-rose-500',
};
const stageName = (value: string) => value.replace(/_/g, ' ');
const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

export default function ApiDashboardPage() {
  const { apiBaseUrl, authHeaders } = useAuth();
  const query = useQuery({ queryKey: ['dashboard-summary'], queryFn: async () => { const response = await fetch(`${apiBaseUrl}/dashboard/summary`, { headers: authHeaders() }); if (!response.ok) throw new Error('Dashboard metrics could not be loaded.'); return response.json() as Promise<DashboardData>; }, refetchInterval: 60000 });
  const data = query.data;
  const metrics = data?.metrics;
  const total = metrics?.total ?? 0;
  const stages = [...(data?.stages ?? [])].sort((a, b) => b.count - a.count);
  const peak = Math.max(1, ...stages.map((stage) => stage.count));

  return <MainLayout>
    <div className="space-y-8 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow mb-2">Executive Lead Control <span className="px-1 text-accent">/</span> Overview</p>
          <h1 className="page-title text-[2rem] leading-tight md:text-[2.65rem]">Your pipeline, in view.</h1>
          <p className="mt-2 text-sm text-muted-foreground">A current read on new demand, qualified opportunities and the conversations waiting for your team.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-success" /> Updated <span className="font-medium text-foreground">{query.dataUpdatedAt ? new Date(query.dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
        </div>
      </header>

      {query.isError && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{query.error.message}</div>}

      <section className="grid overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-2 xl:grid-cols-4" aria-label="CRM metrics">
        {[
          { label: 'Active portfolio', value: metrics?.total, note: `${metrics?.created_last_7_days ?? 0} arrived in the last 7 days`, icon: Users, signal: 'Current records' },
          { label: 'Qualified onward', value: metrics?.qualified_or_beyond, note: `${metrics?.scored ?? 0} leads have a score`, icon: ArrowUpRight, signal: total ? `${Math.round(((metrics?.qualified_or_beyond ?? 0) / total) * 100)}% of portfolio` : 'No leads yet' },
          { label: 'Closed won', value: metrics?.won, note: 'Recorded in this workspace', icon: MoveUpRight, signal: total ? `${Math.round(((metrics?.won ?? 0) / total) * 100)}% of portfolio` : 'No leads yet' },
          { label: 'Needs a reply', value: data?.messaging.unread_conversations, note: `${data?.messaging.unread_messages ?? 0} unread messages`, icon: Inbox, signal: 'WhatsApp inbox' },
        ].map(({ label, value, note, icon: Icon, signal }, index) => <article key={label} className={`relative min-h-36 p-5 md:p-6 ${index < 3 ? 'xl:border-r' : ''} ${index < 2 ? 'border-b sm:border-b-0 xl:border-b-0' : ''} ${index === 0 ? 'sm:border-r' : ''} ${index === 2 ? 'sm:border-r xl:border-r' : ''} ${index === 1 ? 'xl:border-r' : ''}`}>
          <div className="flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground">{label}</p><Icon className="h-4 w-4 text-muted-foreground/70" /></div>
          <p className="mt-5 font-mono text-[2.15rem] leading-none tracking-[-.07em]">{query.isLoading ? '···' : value ?? '—'}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px]"><span className="text-muted-foreground">{note}</span><span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-medium text-secondary-foreground">{signal}</span></div>
        </article>)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <article className="surface-card overflow-hidden">
          <div className="flex items-start justify-between border-b border-border px-5 py-5 md:px-6">
            <div><p className="eyebrow">01 <span className="px-1 text-accent">/</span> Distribution</p><h2 className="mt-2 text-lg font-semibold tracking-tight">Where work stands</h2></div>
            <Link to="/pipeline" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-accent">Open pipeline <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="space-y-4 p-5 md:p-6">
            {query.isLoading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading portfolio…</p> : stages.length ? stages.map((stage) => <div key={stage.status} className="grid grid-cols-[108px_1fr_32px] items-center gap-3">
              <span className="truncate text-xs font-medium capitalize text-muted-foreground">{stageName(stage.status)}</span>
              <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${stageTone[stage.status] ?? 'bg-accent'}`} style={{ width: `${Math.max(3, (stage.count / peak) * 100)}%` }} /></div>
              <span className="text-right font-mono text-xs tabular-nums">{stage.count}</span>
            </div>) : <div className="rounded-lg border border-dashed border-border px-5 py-10 text-center"><p className="text-sm font-medium">Nothing in the pipeline yet</p><p className="mt-1 text-xs text-muted-foreground">New leads will appear here as your team adds them.</p><Link to="/leads" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent">Go to leads <ArrowRight className="h-3 w-3" /></Link></div>}
            {stages.length > 0 && <div className="flex justify-between border-t border-border pt-3 text-[11px] text-muted-foreground"><span>{stages.length} active stages</span><span>{total} records total</span></div>}
          </div>
        </article>

        <article className="surface-card overflow-hidden">
          <div className="flex items-start justify-between border-b border-border px-5 py-5 md:px-6">
            <div><p className="eyebrow">02 <span className="px-1 text-accent">/</span> Intake</p><h2 className="mt-2 text-lg font-semibold tracking-tight">Recently received</h2></div>
            <Link to="/leads" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-accent">All leads <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="divide-y divide-border">
            {query.isLoading ? <p className="px-6 py-10 text-center text-sm text-muted-foreground">Loading recent leads…</p> : data?.recentLeads.length ? data.recentLeads.slice(0, 6).map((lead) => <Link key={lead.id} to={`/leads?q=${encodeURIComponent(lead.name)}`} className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-secondary/45 md:px-6">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-background font-mono text-[10px] font-semibold text-muted-foreground">{initials(lead.name)}</div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium group-hover:text-accent">{lead.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{lead.source} <span className="px-1">·</span> {new Date(lead.createdAt).toLocaleDateString()}</p></div>
              <div className="flex shrink-0 flex-col items-end gap-1.5"><Badge variant="outline" className="capitalize">{stageName(lead.status)}</Badge>{lead.score !== null && <span className="font-mono text-[10px] text-muted-foreground">Score {lead.score}</span>}</div>
            </Link>) : <div className="px-6 py-10 text-center"><p className="text-sm font-medium">Waiting on your first lead</p><p className="mt-1 text-xs text-muted-foreground">Capture an opportunity to start building the picture.</p></div>}
          </div>
        </article>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 md:px-6"><div><p className="eyebrow">03 <span className="px-1 text-accent">/</span> Audit trail</p><h2 className="mt-1.5 text-base font-semibold">Latest activity</h2></div><span className="text-[11px] text-muted-foreground">Recent changes across your workspace</span></div>
        {data?.recentActivity.length ? <div className="grid divide-y divide-border md:grid-cols-2 md:divide-y-0 md:divide-x">{data.recentActivity.slice(0, 6).map((event, index) => <div key={`${event.eventType}-${event.entityId}-${index}`} className="flex min-w-0 items-start gap-3 p-4 md:p-5">
          <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">{event.eventType.includes('created') ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium capitalize">{event.eventType.replace(/[._]/g, ' ')}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{event.actorName ?? 'System'} <span className="px-1">·</span> {new Date(event.createdAt).toLocaleString()}</p></div>
        </div>)}</div> : <p className="px-6 py-7 text-sm text-muted-foreground">Activity will appear here as your team works in the CRM.</p>}
      </section>
    </div>
  </MainLayout>;
}
