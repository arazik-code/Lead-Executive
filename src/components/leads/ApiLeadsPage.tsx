import { FormEvent, Fragment, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowRight, Download, Plus, RefreshCw, Search, Users } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LeadCsvImport } from './LeadCsvImport';
import { downloadCsv } from '@/lib/lead-csv';

type LeadStatus = 'new' | 'qualifying' | 'qualified' | 'assigned' | 'contacted' | 'meeting_scheduled' | 'nurture' | 'won' | 'lost';
interface PersistedLead {
  id: string; name: string; phone: string; email: string | null; budgetAmount: string | null;
  budgetCurrency: string | null; status: LeadStatus; source: string; intent: string | null; timeline: string | null; region: string | null; propertyType: string | null; score: number | null; assignedTo: string | null; createdAt: string;
}
interface LeadPage { data: PersistedLead[]; page: { limit: number; offset: number; hasMore: boolean }; }
interface LeadActivity { kind: string; details: Record<string, unknown>; actorName: string; occurredAt: string; }

const statuses: LeadStatus[] = ['new', 'qualifying', 'qualified', 'assigned', 'contacted', 'meeting_scheduled', 'nurture', 'won', 'lost'];
const nextStatus: Partial<Record<LeadStatus, LeadStatus>> = {
  new: 'qualifying', qualifying: 'qualified', assigned: 'contacted',
  contacted: 'meeting_scheduled', meeting_scheduled: 'won', lost: 'nurture',
};

export default function ApiLeadsPage() {
  const { apiBaseUrl, authHeaders, user } = useAuth();
  const [searchParams]=useSearchParams();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState<string | null>(null);
  const [intent, setIntent] = useState('');
  const [timeline, setTimeline] = useState('');
  const [region, setRegion] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [searchInput, setSearchInput] = useState(()=>searchParams.get('q')??'');
  const [search, setSearch] = useState(()=>searchParams.get('q')??'');
  const [status, setStatus] = useState('');
  const [offset, setOffset] = useState(0);
  const [activityLeadId, setActivityLeadId] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState('');


  const leadsQuery = useQuery({
    queryKey: ['api-leads', { search, status, offset }],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '25', offset: String(offset) });
      if (search) params.set('q', search);
      if (status) params.set('status', status);
      const response = await fetch(`${apiBaseUrl}/leads?${params}`, { headers: authHeaders() });
      if (!response.ok) throw new Error('Could not load leads. Check your access or API connection.');
      return response.json() as Promise<LeadPage>;
    },
  });
  const orgSettingsQuery = useQuery({ queryKey: ['organization-settings'], queryFn: async () => { const response=await fetch(`${apiBaseUrl}/settings`,{headers:authHeaders()}); if(!response.ok)throw new Error('Organization defaults could not be loaded.'); return response.json() as Promise<{organization:{defaultCurrency:string}|null}>; } });
  const effectiveCurrency=budgetCurrency??orgSettingsQuery.data?.organization?.defaultCurrency??'AED';

  const activityQuery = useQuery({
    queryKey: ['api-lead-activity', activityLeadId],
    enabled: Boolean(activityLeadId),
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/leads/${activityLeadId}/activity`, { headers: authHeaders() });
      if (!response.ok) throw new Error('Could not load this lead activity.');
      return response.json() as Promise<{ data: LeadActivity[] }>;
    },
  });

  const createLead = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${apiBaseUrl}/leads`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name, phone, email: email || undefined, intent: intent || undefined, timeline: timeline || undefined, region: region || undefined, propertyType: propertyType || undefined, budgetAmount: budgetAmount ? Number(budgetAmount) : undefined, budgetCurrency: budgetAmount ? effectiveCurrency : undefined }),
      });
      if (!response.ok) { const payload = await response.json().catch(() => ({})) as { message?: string }; throw new Error(Array.isArray(payload.message) ? payload.message.join(', ') : payload.message ?? 'Lead could not be saved.'); }
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['api-leads'] });
      setFormOpen(false); setError(''); setName(''); setPhone(''); setEmail(''); setBudgetAmount(''); setBudgetCurrency(null); setIntent(''); setTimeline(''); setRegion(''); setPropertyType('');
    },
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'Lead could not be saved.'),
  });

  const moveLead = useMutation({
    mutationFn: async ({ lead, status }: { lead: PersistedLead; status: LeadStatus }) => {
      const response = await fetch(`${apiBaseUrl}/leads/${lead.id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status, reason: 'Updated from lead workspace' }),
      });
      if (!response.ok) { const payload = await response.json().catch(() => ({})) as { message?: string }; throw new Error(payload.message ?? 'Lead status could not be changed.'); }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-leads'] }),
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'Lead status could not be changed.'),
  });

  const assignLead = useMutation({
    mutationFn: async (lead: PersistedLead) => {
      const response = await fetch(`${apiBaseUrl}/leads/${lead.id}/assign-self`, { method: 'POST', headers: authHeaders() });
      if (!response.ok) { const payload = await response.json().catch(() => ({})) as { message?: string }; throw new Error(payload.message ?? 'Lead could not be assigned.'); }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-leads'] }),
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'Lead could not be assigned.'),
  });

  const exportLeads = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${apiBaseUrl}/leads/export`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ search: search || undefined, status: status || undefined }) });
      if (!response.ok) { const body = await response.json().catch(() => ({})) as { message?: string }; throw new Error(body.message ?? 'Lead export failed.'); }
      return response.json() as Promise<{ data: PersistedLead[]; truncated: boolean }>;
    },
    onSuccess: ({ data, truncated }) => {
      downloadCsv(`executive-leads-${new Date().toISOString().slice(0,10)}.csv`, ['Name','Phone','Email','Budget Amount','Budget Currency','Stage','Source','Notes','Intent','Timeline','Region','Property Type','Score','Created At','Updated At'], data.map((lead) => [lead.name,lead.phone,lead.email,lead.budgetAmount,lead.budgetCurrency,lead.status,lead.source,(lead as PersistedLead & { notes?: string }).notes,lead.intent,lead.timeline,lead.region,lead.propertyType,lead.score,lead.createdAt,(lead as PersistedLead & { updatedAt?: string }).updatedAt]));
      setExportNotice(`Exported ${data.length} authorized lead records${truncated ? ' (maximum 10,000 reached; apply filters for more)' : ''}.`);
    },
    onError: (cause) => setExportNotice(cause instanceof Error ? cause.message : 'Lead export failed.'),
  });

  const handleSubmit = (event: FormEvent) => { event.preventDefault(); setError(''); createLead.mutate(); };

  return <MainLayout>
    <PageHeader section="Lead register" title="Every opportunity, accounted for." description="One shared record of your prospects, their qualification and what needs to happen next." actions={<>{(user?.role === 'admin' || user?.role === 'manager') && <Button variant="outline" disabled={exportLeads.isPending} onClick={() => exportLeads.mutate()}><Download className="mr-2 h-4 w-4"/>{exportLeads.isPending ? 'Preparing…' : 'Export CSV'}</Button>}<Button onClick={() => setFormOpen(!formOpen)}><Plus className="mr-2 h-4 w-4" />Add lead</Button></>} />
    {exportNotice && <p role="status" className="mb-3 text-sm text-muted-foreground">{exportNotice}</p>}

    {formOpen && <Card className="mb-5">
      <CardHeader><CardTitle className="text-base">Create lead</CardTitle></CardHeader>
      <CardContent>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-1"><Label htmlFor="api-lead-name">Name</Label><Input id="api-lead-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={160} /></div>
          <div className="space-y-1"><Label htmlFor="api-lead-phone">Phone (UAE numbers may be local or international)</Label><Input id="api-lead-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={32} /></div>
          <div className="space-y-1"><Label htmlFor="api-lead-email">Email</Label><Input id="api-lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="api-lead-intent">Intent</Label><Input id="api-lead-intent" value={intent} onChange={(e) => setIntent(e.target.value)} maxLength={120} placeholder="Investment, end use…" /></div>
          <div className="space-y-1"><Label htmlFor="api-lead-timeline">Timeline</Label><Input id="api-lead-timeline" value={timeline} onChange={(e) => setTimeline(e.target.value)} maxLength={120} placeholder="Immediate, 3–6 months…" /></div>
          <div className="space-y-1"><Label htmlFor="api-lead-region">Region</Label><Input id="api-lead-region" value={region} onChange={(e) => setRegion(e.target.value)} maxLength={120} placeholder="Dubai Marina…" /></div>
          <div className="space-y-1"><Label htmlFor="api-lead-property-type">Property type</Label><Input id="api-lead-property-type" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} maxLength={120} placeholder="Villa, apartment…" /></div>
          <div className="grid grid-cols-[1fr_100px] gap-2">
            <div className="space-y-1"><Label htmlFor="api-lead-budget">Budget</Label><Input id="api-lead-budget" type="number" min="0" step="0.01" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="api-lead-currency">Currency</Label><select id="api-lead-currency" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={effectiveCurrency} onChange={(e) => setBudgetCurrency(e.target.value)}><option>AED</option><option>USD</option><option>EUR</option><option>GBP</option></select></div>
          </div>
          <div className="md:col-span-2 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" disabled={createLead.isPending}>{createLead.isPending ? 'Saving…' : 'Save lead'}</Button></div>
        </form>
      </CardContent>
    </Card>}

    <LeadCsvImport onImported={() => { void leadsQuery.refetch(); }} />

    {error && <div role="alert" className="mb-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" />Leads <span className="text-sm font-normal text-muted-foreground">{leadsQuery.data?.data.length ?? ''}</span></CardTitle></CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <form className="flex flex-1 gap-2" onSubmit={(event) => { event.preventDefault(); setOffset(0); setSearch(searchInput.trim()); }}>
            <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input aria-label="Search leads" className="pl-9" placeholder="Search name, phone, or email" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /></div>
            <Button type="submit" variant="outline">Search</Button>
          </form>
          <select aria-label="Filter leads by stage" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={status} onChange={(event) => { setStatus(event.target.value); setOffset(0); }}><option value="">All stages</option>{statuses.map((stage) => <option key={stage} value={stage}>{stage.replace(/_/g, ' ')}</option>)}</select>
        </div>
        {leadsQuery.isPending ? <p className="py-8 text-center text-sm text-muted-foreground">Loading leads…</p>
          : leadsQuery.isError ? <div className="py-8 text-center"><p className="mb-3 text-sm text-destructive">{leadsQuery.error.message}</p><Button variant="outline" onClick={() => void leadsQuery.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button></div>
          : !leadsQuery.data?.data.length ? <p className="py-8 text-center text-sm text-muted-foreground">No leads are available to this account yet.</p>
          : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Lead</th><th className="p-3">Budget</th><th className="p-3">Stage</th><th className="p-3">Source</th><th className="p-3">Created</th><th className="p-3">Next action</th></tr></thead><tbody>
            {leadsQuery.data.data.map((lead) => <Fragment key={lead.id}>
              <tr className="border-b last:border-0"><td className="p-3"><p className="font-medium">{lead.name}</p><p className="text-xs text-muted-foreground">{lead.phone}{lead.email ? ` · ${lead.email}` : ''}</p></td><td className="p-3">{lead.budgetAmount ? `${lead.budgetCurrency} ${Number(lead.budgetAmount).toLocaleString()}` : '—'}</td><td className="p-3"><Badge variant="secondary">{lead.status.replace(/_/g, ' ')}</Badge></td><td className="p-3">{lead.source}</td><td className="p-3">{new Date(lead.createdAt).toLocaleDateString()}</td><td className="p-3"><div className="flex flex-wrap gap-2">{lead.status === 'qualified' ? <Button size="sm" variant="outline" disabled={assignLead.isPending} onClick={() => assignLead.mutate(lead)}>Assign to me<ArrowRight className="ml-2 h-3 w-3" /></Button> : nextStatus[lead.status] && <Button size="sm" variant="outline" disabled={moveLead.isPending} onClick={() => moveLead.mutate({ lead, status: nextStatus[lead.status]! })}>Move to {nextStatus[lead.status]!.replace(/_/g, ' ')}<ArrowRight className="ml-2 h-3 w-3" /></Button>}<Button size="sm" variant="ghost" onClick={() => setActivityLeadId(activityLeadId === lead.id ? null : lead.id)}>{activityLeadId === lead.id ? 'Hide history' : 'History'}</Button></div></td></tr>
              {activityLeadId === lead.id && <tr className="border-b bg-muted/20"><td className="p-4" colSpan={6}><p className="mb-3 font-medium">Lead activity</p>{activityQuery.isPending ? <p className="text-sm text-muted-foreground">Loading history…</p> : activityQuery.isError ? <p role="alert" className="text-sm text-destructive">{activityQuery.error.message}</p> : !activityQuery.data?.data.length ? <p className="text-sm text-muted-foreground">No activity has been recorded.</p> : <ol className="space-y-3">{activityQuery.data.data.map((event, index) => <li key={`${event.kind}-${event.occurredAt}-${index}`} className="border-l-2 border-primary/40 pl-3"><p className="text-sm font-medium">{event.kind.replace(/^lead\./, '').replace(/_/g, ' ').replace(/\./g, ' ')}</p><p className="text-xs text-muted-foreground">{new Date(event.occurredAt).toLocaleString()} · {typeof event.details.to === 'string' ? `Stage: ${String(event.details.from ?? 'start')} → ${event.details.to}` : `By ${event.actorName}`}{typeof event.details.reason === 'string' ? ` · ${event.details.reason}` : ''}</p></li>)}</ol>}</td></tr>}
            </Fragment>)}
          </tbody></table></div>}
      </CardContent>
    </Card>
    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>Showing {offset + 1}–{offset + (leadsQuery.data?.data.length ?? 0)} non-archived leads. Workflow stages are validated and audited by the API.</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={offset === 0 || leadsQuery.isFetching} onClick={() => setOffset(Math.max(0, offset - 25))}>Previous</Button><Button size="sm" variant="outline" disabled={!leadsQuery.data?.page.hasMore || leadsQuery.isFetching} onClick={() => setOffset(offset + 25)}>Next</Button></div></div>
  </MainLayout>;
}
