import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Eye, Play, RefreshCw, Save, Users } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RuleSetVersion { id: string; version: number; state: 'draft' | 'active' | 'retired'; rules: { rules: unknown[] }; }
interface Lead { id: string; name: string; status: string; score: number | null; }
interface Agent { id: string; displayName: string; email: string; status: 'available' | 'busy' | 'offline' | null; specialties: string[]; regions: string[]; maxActiveLeads: number; medianResponseMinutes: number; activeLeads: number; }
interface RoutingResult { outcome: 'assigned' | 'queued'; reason?: string; explanation?: string; agentId?: string; selectedAgentId?: string; matchedRuleId?: string; eligibleAgentIds: string[]; ruleSetVersion?: number; preview?: boolean; status?: string; }

async function apiRequest<T>(url: string, init: RequestInit, headers: () => Record<string, string>): Promise<T> {
  const response = await fetch(url, { ...init, headers: { ...headers(), ...init.headers } });
  if (!response.ok) { const body = await response.json().catch(() => ({})) as { message?: string | string[] }; throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message ?? 'Routing request failed.'); }
  return response.json() as Promise<T>;
}

export default function ApiRoutingPage() {
  const { apiBaseUrl, authHeaders, user } = useAuth();
  const queryClient = useQueryClient();
  const canConfigure = user?.role === 'admin' || user?.role === 'manager';
  const [ruleJson, setRuleJson] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [decision, setDecision] = useState<RoutingResult | null>(null);
  const [error, setError] = useState('');
  const rulesQuery = useQuery({ queryKey: ['routing-rule-versions'], enabled: canConfigure, queryFn: () => apiRequest<{ data: RuleSetVersion[] }>(`${apiBaseUrl}/routing/rules`, {}, authHeaders) });
  const agentsQuery = useQuery({ queryKey: ['routing-agents'], enabled: canConfigure, queryFn: () => apiRequest<{ data: Agent[] }>(`${apiBaseUrl}/routing/agents`, {}, authHeaders) });
  const leadsQuery = useQuery({ queryKey: ['api-leads', 'routing-selector'], queryFn: () => apiRequest<{ data: Lead[] }>(`${apiBaseUrl}/leads?limit=100`, {}, authHeaders) });
  const activeQuery = useQuery({ queryKey: ['routing-active-rules'], queryFn: () => apiRequest<RuleSetVersion | null>(`${apiBaseUrl}/routing/rules/active`, {}, authHeaders) });

  const saveRules = useMutation({
    mutationFn: () => {
      let rules: unknown;
      try { rules = JSON.parse(ruleJson); } catch { throw new Error('Enter a valid JSON routing configuration.'); }
      return apiRequest<RuleSetVersion>(`${apiBaseUrl}/routing/rules`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rules) }, authHeaders);
    },
    onSuccess: async (version) => { setSelectedVersionId(version.id); setError(''); await queryClient.invalidateQueries({ queryKey: ['routing-rule-versions'] }); },
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'Routing draft could not be saved.'),
  });
  const activate = useMutation({
    mutationFn: () => apiRequest<RuleSetVersion>(`${apiBaseUrl}/routing/rules/${selectedVersionId}/activate`, { method: 'POST' }, authHeaders),
    onSuccess: async () => { setError(''); await Promise.all([queryClient.invalidateQueries({ queryKey: ['routing-rule-versions'] }), queryClient.invalidateQueries({ queryKey: ['routing-active-rules'] })]); },
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'Rule version could not be activated.'),
  });
  const saveAgent = useMutation({
    mutationFn: (agent: Agent) => apiRequest<Agent>(`${apiBaseUrl}/routing/agents/${agent.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: agent.status ?? 'offline', specialties: agent.specialties, regions: agent.regions, maxActiveLeads: agent.maxActiveLeads, medianResponseMinutes: agent.medianResponseMinutes }) }, authHeaders),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['routing-agents'] }); },
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'Agent profile could not be saved.'),
  });
  const preview = useMutation({
    mutationFn: () => apiRequest<RoutingResult>(`${apiBaseUrl}/leads/${selectedLeadId}/routing-preview`, {}, authHeaders),
    onSuccess: (value) => { setDecision(value); setError(''); },
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'Routing preview failed.'),
  });
  const routeLead = useMutation({
    mutationFn: () => apiRequest<RoutingResult>(`${apiBaseUrl}/leads/${selectedLeadId}/route`, { method: 'POST' }, authHeaders),
    onSuccess: async (value) => { setDecision(value); setError(''); await Promise.all([queryClient.invalidateQueries({ queryKey: ['api-leads'] }), queryClient.invalidateQueries({ queryKey: ['routing-agents'] })]); },
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'Lead could not be routed.'),
  });

  const selectedVersion = rulesQuery.data?.data.find((version) => version.id === selectedVersionId);
  const editVersion = async () => {
    try { const version = await apiRequest<RuleSetVersion>(`${apiBaseUrl}/routing/rules/${selectedVersionId}`, {}, authHeaders); setRuleJson(JSON.stringify(version.rules, null, 2)); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Rules could not be loaded.'); }
  };
  const updateAgent = (id: string, patch: Partial<Agent>) => agentsQuery.data && queryClient.setQueryData<{ data: Agent[] }>(['routing-agents'], { data: agentsQuery.data.data.map((agent) => agent.id === id ? { ...agent, ...patch } : agent) });

  return <MainLayout>
    <PageHeader section="Routing desk" title="Put the right lead in motion." description="Build versioned assignment rules, balance agent capacity and inspect the decision before routing." />
    {error && <div role="alert" className="mb-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
    {canConfigure && <>
      <Card className="mb-6"><CardHeader><CardTitle className="text-base">Routing rule versions</CardTitle></CardHeader><CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Active rules are immutable versions. New policies remain drafts until explicitly activated. Conditions are evaluated by priority; first match wins.</p>
        <div className="flex flex-wrap gap-2"><select aria-label="Select routing version" className="h-9 min-w-56 rounded-md border border-input bg-background px-3 text-sm" value={selectedVersionId} onChange={(event) => setSelectedVersionId(event.target.value)}><option value="">Select version</option>{rulesQuery.data?.data.map((version) => <option key={version.id} value={version.id}>v{version.version} · {version.state}</option>)}</select><Button variant="outline" disabled={!selectedVersionId} onClick={() => void editVersion()}><RefreshCw className="mr-2 h-4 w-4" />Load version</Button><Button variant="outline" disabled={!activeQuery.data} onClick={() => setRuleJson(JSON.stringify(activeQuery.data?.rules, null, 2))}>Copy active rules</Button></div>
        <div className="space-y-2"><Label htmlFor="routing-rule-json">Rules JSON</Label><textarea id="routing-rule-json" className="min-h-52 w-full rounded-md border border-input bg-background p-3 font-mono text-xs" value={ruleJson} onChange={(event) => setRuleJson(event.target.value)} placeholder={'{"rules":[{"id":"high-score","name":"High score","enabled":true,"priority":1,"conditions":[{"field":"score","operator":"greaterThanOrEqual","value":80}],"agentIds":[]}]'} /></div>
        <div className="flex justify-end gap-2"><Button variant="outline" disabled={!ruleJson.trim() || saveRules.isPending} onClick={() => saveRules.mutate()}><Save className="mr-2 h-4 w-4" />Save draft</Button><Button disabled={!selectedVersion || selectedVersion.state !== 'draft' || activate.isPending} onClick={() => activate.mutate()}>Activate selected version</Button></div>
      </CardContent></Card>
      <Card className="mb-6"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" />Agent profiles and capacity</CardTitle></CardHeader><CardContent className="space-y-3">
        {!agentsQuery.data?.data.length ? <p className="text-sm text-muted-foreground">No active agent accounts are provisioned for this organization yet.</p> : agentsQuery.data.data.map((agent) => <div key={agent.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-[1.2fr_130px_110px_140px_140px_1fr_auto] md:items-end">
          <div><p className="font-medium">{agent.displayName}</p><p className="text-xs text-muted-foreground">{agent.email} · {agent.activeLeads}/{agent.maxActiveLeads} active</p></div>
          <div className="space-y-1"><Label>Status</Label><select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={agent.status ?? 'offline'} onChange={(event) => updateAgent(agent.id, { status: event.target.value as Agent['status'] })}><option value="available">Available</option><option value="busy">Busy</option><option value="offline">Offline</option></select></div>
          <div className="space-y-1"><Label>Max active leads</Label><Input type="number" min="1" max="1000" value={agent.maxActiveLeads} onChange={(event) => updateAgent(agent.id, { maxActiveLeads: Number(event.target.value) })} /></div>
          <div className="space-y-1"><Label>Median response (min)</Label><Input type="number" min="0" value={agent.medianResponseMinutes} onChange={(event) => updateAgent(agent.id, { medianResponseMinutes: Number(event.target.value) })} /></div>
          <div className="space-y-1"><Label>Regions (comma separated)</Label><Input value={agent.regions.join(', ')} onChange={(event) => updateAgent(agent.id, { regions: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} /></div>
          <div className="space-y-1"><Label>Specialties (comma separated)</Label><Input value={agent.specialties.join(', ')} onChange={(event) => updateAgent(agent.id, { specialties: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} /></div>
          <Button size="sm" disabled={saveAgent.isPending} onClick={() => saveAgent.mutate(agent)}>Save profile</Button>
        </div>)}
      </CardContent></Card>
    </>}
    <Card><CardHeader><CardTitle className="text-base">Preview and route a qualified lead</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="flex flex-wrap items-end gap-2"><div className="min-w-64 flex-1 space-y-1"><Label htmlFor="routing-lead">Lead</Label><select id="routing-lead" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedLeadId} onChange={(event) => { setSelectedLeadId(event.target.value); setDecision(null); }}><option value="">Select a lead</option>{leadsQuery.data?.data.map((lead) => <option key={lead.id} value={lead.id}>{lead.name} · {lead.status} · score {lead.score ?? '—'}</option>)}</select></div><Button variant="outline" disabled={!selectedLeadId || preview.isPending} onClick={() => preview.mutate()}><Eye className="mr-2 h-4 w-4" />Preview</Button><Button disabled={!selectedLeadId || routeLead.isPending || user?.role === 'agent'} onClick={() => routeLead.mutate()}><Play className="mr-2 h-4 w-4" />Route lead</Button></div>
      {decision && <div className="rounded-md border border-primary/30 bg-primary/5 p-4"><p className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4 text-primary" />{decision.preview ? 'Preview' : 'Decision'}: {decision.outcome}{decision.agentId || decision.selectedAgentId ? ` · agent ${(decision.agentId ?? decision.selectedAgentId)?.slice(0, 8)}` : ''}</p><p className="mt-1 text-sm text-muted-foreground">{decision.reason ?? decision.explanation}</p><p className="mt-2 text-xs text-muted-foreground">Rule set v{decision.ruleSetVersion ?? '—'} · {decision.eligibleAgentIds.length} eligible agents{decision.matchedRuleId ? ` · rule ${decision.matchedRuleId}` : ''}</p></div>}
      <p className="text-xs text-muted-foreground">Routing is an explicit action at this stage. It only assigns unassigned leads in the qualified stage; no automatic trigger has been activated.</p>
    </CardContent></Card>
  </MainLayout>;
}
