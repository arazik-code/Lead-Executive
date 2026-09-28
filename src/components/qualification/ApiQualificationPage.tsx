import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, FilePlus2, RefreshCw, Save, Send } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type AnswerValue = string | string[] | number | null;
interface FormQuestion { id: string; label: string; answerType?: 'single' | 'multiple' | 'text' | 'number'; enabled: boolean; required: boolean; weight: number; pointsByOption: Record<string, number> | null; }
interface QualificationForm { questions: FormQuestion[]; thresholds: { mediumMinimum: number; highMinimum: number }; }
interface FormVersion { id: string; version: number; state: 'draft' | 'published' | 'retired'; form: QualificationForm; }
interface Lead { id: string; name: string; status: string; score: number | null; }
interface ScoreResult { score: { score: number; completionRate: number }; tier: 'low' | 'medium' | 'high'; formVersion: number; breakdown: { components: { questionId: string; points: number | null; weightedPoints: number }[] }; }

async function requestJson<T>(url: string, init: RequestInit, authHeaders: () => Record<string, string>): Promise<T> {
  const response = await fetch(url, { ...init, headers: { ...authHeaders(), ...init.headers } });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { message?: string | string[] };
    throw new Error(Array.isArray(payload.message) ? payload.message.join(', ') : payload.message ?? 'Request failed.');
  }
  return response.json() as Promise<T>;
}

export default function ApiQualificationPage() {
  const { apiBaseUrl, authHeaders, user } = useAuth();
  const queryClient = useQueryClient();
  const [formJson, setFormJson] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState('');
  const canConfigure = user?.role === 'admin' || user?.role === 'manager';

  const versionsQuery = useQuery({
    queryKey: ['qualification-form-versions'], enabled: canConfigure,
    queryFn: () => requestJson<{ data: FormVersion[] }>(`${apiBaseUrl}/qualification/forms`, {}, authHeaders),
  });
  const activeQuery = useQuery({
    queryKey: ['qualification-active-form'],
    queryFn: () => requestJson<FormVersion | null>(`${apiBaseUrl}/qualification/forms/active`, {}, authHeaders),
  });
  const leadsQuery = useQuery({
    queryKey: ['api-leads', 'qualification-selector'],
    queryFn: () => requestJson<{ data: Lead[] }>(`${apiBaseUrl}/leads?limit=100`, {}, authHeaders),
  });

  const saveDraft = useMutation({
    mutationFn: () => {
      let definition: unknown;
      try { definition = JSON.parse(formJson); } catch { throw new Error('Enter a valid JSON form definition.'); }
      return requestJson<FormVersion>(`${apiBaseUrl}/qualification/forms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(definition) }, authHeaders);
    },
    onSuccess: async (version) => { setSelectedVersionId(version.id); setError(''); await queryClient.invalidateQueries({ queryKey: ['qualification-form-versions'] }); },
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'Form draft could not be saved.'),
  });
  const publishDraft = useMutation({
    mutationFn: () => requestJson<FormVersion>(`${apiBaseUrl}/qualification/forms/${selectedVersionId}/publish`, { method: 'POST' }, authHeaders),
    onSuccess: async () => { setError(''); await Promise.all([queryClient.invalidateQueries({ queryKey: ['qualification-form-versions'] }), queryClient.invalidateQueries({ queryKey: ['qualification-active-form'] })]); },
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'Form version could not be published.'),
  });
  const submitAnswers = useMutation({
    mutationFn: () => requestJson<ScoreResult>(`${apiBaseUrl}/leads/${leadId}/qualification-answers`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(answers),
    }, authHeaders),
    onSuccess: (value) => { setResult(value); setError(''); void queryClient.invalidateQueries({ queryKey: ['api-leads'] }); },
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'Answers could not be submitted.'),
  });

  const selectedVersion = versionsQuery.data?.data.find((version) => version.id === selectedVersionId);
  const activeForm = activeQuery.data?.form;
  const setAnswer = (questionId: string, value: AnswerValue) => setAnswers((current) => ({ ...current, [questionId]: value }));
  const loadSelectedVersion = async () => {
    if (!selectedVersionId) return;
    try {
      const version = await requestJson<FormVersion>(`${apiBaseUrl}/qualification/forms/${selectedVersionId}`, {}, authHeaders);
      setFormJson(JSON.stringify(version.form, null, 2)); setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Form version could not be loaded.'); }
  };
  const handleSubmit = (event: FormEvent) => { event.preventDefault(); setError(''); setResult(null); submitAnswers.mutate(); };

  return <MainLayout>
    <PageHeader section="Qualification" title="Understand buying intent." description="Collect consistent answers, see how each response contributes and keep a versioned record of your scoring policy." />
    {error && <div role="alert" className="mb-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

    {canConfigure && <Card className="mb-6"><CardHeader><CardTitle className="text-base">Form versions and score policy</CardTitle></CardHeader><CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">Drafts are validated by the API and only become active after an explicit publish. Use business-approved answer mappings and score bands.</p>
      <div className="flex flex-wrap gap-2"><select aria-label="Select form version" className="h-9 min-w-56 rounded-md border border-input bg-background px-3 text-sm" value={selectedVersionId} onChange={(event) => setSelectedVersionId(event.target.value)}><option value="">Select version</option>{versionsQuery.data?.data.map((version) => <option key={version.id} value={version.id}>v{version.version} · {version.state}</option>)}</select><Button variant="outline" disabled={!selectedVersionId} onClick={() => void loadSelectedVersion()}><RefreshCw className="mr-2 h-4 w-4" />Load version</Button><Button variant="outline" disabled={!activeQuery.data} onClick={() => setFormJson(JSON.stringify(activeQuery.data?.form, null, 2))}>Copy active form</Button></div>
      <div className="space-y-2"><Label htmlFor="qualification-form-json">Form definition</Label><Textarea id="qualification-form-json" className="min-h-56 font-mono text-xs" value={formJson} onChange={(event) => setFormJson(event.target.value)} placeholder={'Paste a JSON object with questions and thresholds, e.g. {"questions":[{"id":"budget","label":"Budget readiness","answerType":"single","enabled":true,"required":true,"weight":50,"pointsByOption":{"ready":100,"not_ready":0}}],"thresholds":{"mediumMinimum":50,"highMinimum":80}}'} /></div>
      <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" disabled={!formJson.trim() || saveDraft.isPending} onClick={() => saveDraft.mutate()}><FilePlus2 className="mr-2 h-4 w-4" />Save draft</Button><Button disabled={!selectedVersion || selectedVersion.state !== 'draft' || publishDraft.isPending} onClick={() => publishDraft.mutate()}><Save className="mr-2 h-4 w-4" />Publish selected draft</Button></div>
    </CardContent></Card>}

    {!activeForm ? <Card><CardContent className="py-10 text-center"><p className="font-medium">No qualification form is published</p><p className="mt-1 text-sm text-muted-foreground">An administrator must configure and publish the approved questions and score bands before lead answers can be recorded.</p></CardContent></Card>
      : <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base">Qualify a lead <Badge variant="secondary">Form v{activeQuery.data?.version}</Badge></CardTitle></CardHeader><CardContent>
        {leadsQuery.isError ? <p role="alert" className="text-sm text-destructive">{leadsQuery.error.message}</p> : <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="max-w-md space-y-1"><Label htmlFor="qualification-lead">Lead</Label><select id="qualification-lead" required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={leadId} onChange={(event) => { setLeadId(event.target.value); setAnswers({}); setResult(null); }}><option value="">Select a lead</option>{leadsQuery.data?.data.map((lead) => <option key={lead.id} value={lead.id}>{lead.name} · {lead.status}</option>)}</select></div>
          {activeForm.questions.filter((question) => question.enabled).map((question) => <div key={question.id} className="space-y-2 rounded-md border p-4"><Label>{question.label}{question.required ? ' *' : ''}<span className="ml-2 text-xs text-muted-foreground">Weight {question.weight}</span></Label>
            {question.answerType === 'single' && <select className="h-9 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm" required={question.required} value={typeof answers[question.id] === 'string' ? String(answers[question.id]) : ''} onChange={(event) => setAnswer(question.id, event.target.value || null)}><option value="">Choose an answer</option>{Object.keys(question.pointsByOption ?? {}).map((option) => <option key={option} value={option}>{option.replace(/_/g, ' ')}</option>)}</select>}
            {question.answerType === 'multiple' && <div className="flex flex-wrap gap-3">{Object.keys(question.pointsByOption ?? {}).map((option) => <label key={option} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Array.isArray(answers[question.id]) && (answers[question.id] as string[]).includes(option)} onChange={(event) => { const current = Array.isArray(answers[question.id]) ? answers[question.id] as string[] : []; setAnswer(question.id, event.target.checked ? [...current, option] : current.filter((value) => value !== option)); }} />{option.replace(/_/g, ' ')}</label>)}</div>}
            {question.answerType === 'text' && <Input required={question.required} value={typeof answers[question.id] === 'string' ? String(answers[question.id]) : ''} onChange={(event) => setAnswer(question.id, event.target.value || null)} maxLength={2000} />}
            {question.answerType === 'number' && <Input type="number" required={question.required} value={typeof answers[question.id] === 'number' ? String(answers[question.id]) : ''} onChange={(event) => setAnswer(question.id, event.target.value === '' ? null : Number(event.target.value))} />}
            {!question.pointsByOption && question.answerType === 'single' && <p className="text-xs text-muted-foreground">This answer supports completion tracking but has no numeric score mapping.</p>}
          </div>)}
          <div className="flex justify-end"><Button type="submit" disabled={!leadId || submitAnswers.isPending}>{submitAnswers.isPending ? 'Scoring…' : 'Save answers and score lead'}<Send className="ml-2 h-4 w-4" /></Button></div>
        </form>}
        {result && <div className="mt-5 rounded-md border border-primary/30 bg-primary/5 p-4"><p className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4 text-primary" />Score {result.score.score} · {result.tier} · {result.score.completionRate}% complete</p><p className="mt-1 text-xs text-muted-foreground">Calculated using form version {result.formVersion}. Each response is stored with its score contribution for auditability.</p><ul className="mt-3 space-y-1 text-sm">{result.breakdown.components.map((part) => <li key={part.questionId} className="flex justify-between"><span>{activeForm.questions.find((question) => question.id === part.questionId)?.label ?? part.questionId}</span><span>{part.points === null ? 'Unscored' : `${part.points} points · ${part.weightedPoints} weighted`}</span></li>)}</ul></div>}
      </CardContent></Card>}
  </MainLayout>;
}
