import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, FileUp } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LeadCsvRow, parseLeadCsv } from '@/lib/lead-csv';

interface Preview { rows: Array<{ rowNumber: number; status: 'ready'|'invalid'|'duplicate'; issues: string[] }>; summary: { ready: number; duplicates: number; invalid: number }; }
interface Result { imported: Array<{ rowNumber: number; leadId: string }>; skipped: Array<{ rowNumber: number; reason: string }>; summary: { selected: number; imported: number; skipped: number }; }
async function post<T>(url: string, headers: () => Record<string, string>, body: unknown): Promise<T> {
  const response = await fetch(url, { method: 'POST', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) { const data = await response.json().catch(() => ({})) as { message?: string|string[] }; throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'Import request failed.'); }
  return response.json() as Promise<T>;
}

export function LeadCsvImport({ onImported }: { onImported: () => void }) {
  const { apiBaseUrl, authHeaders, user } = useAuth();
  const client = useQueryClient();
  const [rows,setRows] = useState<LeadCsvRow[]>([]); const [fileName,setFileName] = useState('');
  const [selected,setSelected] = useState<number[]>([]); const [preview,setPreview] = useState<Preview|null>(null);
  const [result,setResult] = useState<Result|null>(null); const [error,setError] = useState('');
  const allowed = user?.role === 'admin' || user?.role === 'manager';
  const inspect = useMutation({ mutationFn: () => post<Preview>(`${apiBaseUrl}/leads/import/preview`,authHeaders,{rows}), onSuccess: (data) => { setPreview(data); setSelected(data.rows.filter((row) => row.status === 'ready').map((row) => row.rowNumber)); setResult(null); setError(''); }, onError: (cause) => setError(cause instanceof Error ? cause.message : 'Preview failed.') });
  const commit = useMutation({ mutationFn: () => post<Result>(`${apiBaseUrl}/leads/import/commit`,authHeaders,{rows,selectedRowNumbers:selected,sourceName:fileName}), onSuccess: async (data) => { setResult(data); setError(''); await Promise.all([client.invalidateQueries({queryKey:['api-leads']}),client.invalidateQueries({queryKey:['pipeline-leads']}),client.invalidateQueries({queryKey:['dashboard-summary']})]); onImported(); }, onError: (cause) => setError(cause instanceof Error ? cause.message : 'Import failed.') });
  if (!allowed) return null;
  const selectFile = async (file?: File) => { setRows([]); setPreview(null); setResult(null); setSelected([]); setError(''); if (!file) return; if (file.size > 2_000_000) { setError('CSV files must be 2 MB or smaller.'); return; } try { setRows(parseLeadCsv(await file.text())); setFileName(file.name); } catch (cause) { setError(cause instanceof Error ? cause.message : 'CSV could not be parsed.'); } };
  const toggle = (number: number) => setSelected((current) => current.includes(number) ? current.filter((item) => item !== number) : [...current,number]);
  return <Card className="mb-5"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileUp className="h-4 w-4"/>Import leads from CSV</CardTitle><p className="text-sm text-muted-foreground">Review validation and duplicate detection before saving. Only selected valid rows are imported; maximum 500 rows.</p></CardHeader><CardContent className="space-y-4">
    <div className="flex flex-wrap items-center gap-3"><Input aria-label="Select lead CSV" type="file" accept=".csv,text/csv" className="max-w-md" onChange={(event) => { void selectFile(event.target.files?.[0]); event.currentTarget.value=''; }}/>{rows.length>0 && <><Button variant="outline" disabled={inspect.isPending} onClick={() => inspect.mutate()}>Preview {rows.length} rows</Button>{preview && <Button disabled={!selected.length||commit.isPending} onClick={() => commit.mutate()}>Import {selected.length} selected</Button>}</>}</div>
    {error && <div role="alert" className="flex gap-2 rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0"/>{error}</div>}
    {preview && <><div className="flex gap-2"><Badge>{preview.summary.ready} ready</Badge><Badge variant="secondary">{preview.summary.duplicates} duplicates</Badge><Badge variant="outline">{preview.summary.invalid} invalid</Badge></div><div className="max-h-72 overflow-auto rounded border"><table className="w-full min-w-[650px] text-sm"><thead className="sticky top-0 bg-background"><tr className="border-b text-left"><th className="p-2">Import</th><th className="p-2">Row</th><th className="p-2">Name</th><th className="p-2">Phone</th><th className="p-2">Result</th></tr></thead><tbody>{preview.rows.map((row) => { const lead=rows.find((item) => item.rowNumber===row.rowNumber)!; const imported=result?.imported.some((item)=>item.rowNumber===row.rowNumber); const skipped=result?.skipped.find((item)=>item.rowNumber===row.rowNumber); return <tr key={row.rowNumber} className="border-b"><td className="p-2"><input aria-label={`Import row ${row.rowNumber}`} type="checkbox" checked={selected.includes(row.rowNumber)} disabled={row.status!=='ready'||!!result} onChange={()=>toggle(row.rowNumber)}/></td><td className="p-2">{row.rowNumber}</td><td className="p-2">{lead.name}</td><td className="p-2">{lead.phone}</td><td className="p-2">{imported?'Imported':skipped?`Skipped: ${skipped.reason}`:row.issues.join('; ')||row.status}</td></tr>; })}</tbody></table></div><p className="text-xs text-muted-foreground">Duplicate checks use normalized phone numbers and are repeated transactionally when you import.</p>{result && <p role="status" className="text-sm">Imported {result.summary.imported}; skipped {result.summary.skipped}.</p>}</>}
  </CardContent></Card>;
}
