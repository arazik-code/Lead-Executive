import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, RefreshCw, TrendingUp } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { downloadCsv } from '@/lib/lead-csv';

interface Overview { range: { from: string; to: string; timezone: 'UTC'; days: number }; metrics: { newLeads: number; currentlyQualifiedOrBeyond: number; currentlyWon: number; everQualified: number; everWon: number }; daily: Array<{ date: string; count: number }>; sources: Array<{ source: string; count: number }>; currentStages: Array<{ status: string; count: number }>; }
function isoDay(date: Date) { return date.toISOString().slice(0,10); }
function defaultFrom() { return isoDay(new Date(Date.now() - 29 * 86400000)); }
export default function ApiAnalyticsPage() {
  const { apiBaseUrl, authHeaders } = useAuth();
  const [from,setFrom] = useState(defaultFrom);
  const [to,setTo] = useState(() => isoDay(new Date()));
  const query = useQuery({ queryKey: ['analytics-overview',from,to], queryFn: async () => { const params = new URLSearchParams({from,to}); const response = await fetch(`${apiBaseUrl}/analytics/overview?${params}`,{headers:authHeaders()}); if (!response.ok) { const payload=await response.json().catch(()=>({})) as {message?:string|string[]}; throw new Error(Array.isArray(payload.message)?payload.message.join(', '):payload.message??'Analytics could not be loaded.'); } return response.json() as Promise<Overview>; }, enabled: Boolean(from&&to) });
  const data=query.data;
  const days: Array<{date:string;count:number}> = [];
  if (data) { const counts=new Map(data.daily.map((item)=>[item.date,item.count])); const start=new Date(`${from}T00:00:00Z`); for(let i=0;i<data.range.days;i++){const date=isoDay(new Date(start.getTime()+i*86400000));days.push({date,count:counts.get(date)??0});} }
  const maxDaily=Math.max(1,...days.map((day)=>day.count));
  const exportData=()=>{if(!data)return;downloadCsv(`executive-analytics-${from}-to-${to}.csv`,['Metric','Value'],[['Timezone',data.range.timezone],['From',from],['To',to],['New leads',data.metrics.newLeads],['Ever qualified',data.metrics.everQualified],['Ever won',data.metrics.everWon],['Currently qualified or beyond',data.metrics.currentlyQualifiedOrBeyond],['Currently won',data.metrics.currentlyWon],...data.sources.map((item)=>[`Source: ${item.source}`,item.count]),...data.currentStages.map((item)=>[`Current stage: ${item.status}`,item.count])]);};
  const qualifiedRate=data?.metrics.newLeads?data.metrics.everQualified/data.metrics.newLeads*100:null;
  const wonRate=data?.metrics.everQualified?data.metrics.everWon/data.metrics.everQualified*100:null;
  return <MainLayout><div className="space-y-6"><PageHeader section="Performance" title="Measure the work that moves." description="Read your lead cohorts and lifecycle outcomes over a UTC date window." actions={<><label className="grid gap-1 text-xs text-muted-foreground">From<Input type="date" value={from} onChange={(event)=>setFrom(event.target.value)}/></label><label className="grid gap-1 text-xs text-muted-foreground">Through<Input type="date" value={to} onChange={(event)=>setTo(event.target.value)}/></label><Button variant="outline" onClick={()=>void query.refetch()} disabled={query.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching?'animate-spin':''}`}/>Refresh</Button><Button onClick={exportData} disabled={!data}><Download className="mr-2 h-4 w-4"/>Export</Button></>} />
    {query.isError && <p role="alert" className="rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{query.error.message}</p>}
    {query.isLoading && <p className="text-sm text-muted-foreground">Loading analytics…</p>}
    {data && <><p className="text-xs text-muted-foreground">Cohort: leads created from {from} through {to} UTC. “Ever qualified” and “ever won” mean the lead recorded those lifecycle transitions at any later time.</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{label:'New leads',value:data.metrics.newLeads,sub:'Created in selected period'},{label:'Ever qualified',value:data.metrics.everQualified,sub:qualifiedRate===null?'Rate unavailable':`${qualifiedRate.toFixed(1)}% of cohort`},{label:'Ever won',value:data.metrics.everWon,sub:wonRate===null?'Rate unavailable':`${wonRate.toFixed(1)}% of ever-qualified leads`},{label:'Currently won',value:data.metrics.currentlyWon,sub:`${data.metrics.currentlyQualifiedOrBeyond} currently qualified or further`}].map((metric)=><Card key={metric.label}><CardContent className="p-5"><p className="text-sm text-muted-foreground">{metric.label}</p><p className="mt-2 text-3xl font-semibold">{metric.value}</p><p className="mt-1 text-xs text-muted-foreground">{metric.sub}</p></CardContent></Card>)}</div>
      <div className="grid gap-4 xl:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4"/>Lead creation trend</CardTitle></CardHeader><CardContent><div className="flex min-h-44 items-end gap-1 overflow-x-auto border-b pb-2">{days.map((day)=><div key={day.date} title={`${day.date}: ${day.count} leads`} className="flex min-w-2 flex-1 flex-col items-center justify-end"><span className="mb-1 text-[10px] text-muted-foreground">{day.count||''}</span><div className="w-full min-w-1 rounded-t bg-primary" style={{height:`${Math.max(day.count?4:0,day.count/maxDaily*120)}px`}}/></div>)}</div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{from}</span><span>{to}</span></div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Top lead sources</CardTitle></CardHeader><CardContent className="space-y-3">{data.sources.length?data.sources.map((source)=><div key={source.source} className="flex items-center gap-3"><span className="w-28 truncate text-sm" title={source.source}>{source.source}</span><div className="h-2 flex-1 rounded bg-muted"><div className="h-full rounded bg-primary" style={{width:`${Math.max(2,source.count/Math.max(1,...data.sources.map((item)=>item.count))*100)}%`}}/></div><Badge variant="secondary">{source.count}</Badge></div>):<p className="text-sm text-muted-foreground">No source records in the selected cohort.</p>}</CardContent></Card>
        <Card className="xl:col-span-2"><CardHeader><CardTitle className="text-base">Current stage for selected cohort</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.currentStages.map((stage)=><div key={stage.status} className="flex items-center justify-between rounded border p-3"><span className="text-sm capitalize">{stage.status.replace(/_/g,' ')}</span><Badge>{stage.count}</Badge></div>)}{!data.currentStages.length&&<p className="text-sm text-muted-foreground">No leads were created in this period.</p>}</CardContent></Card>
      </div></>}
  </div></MainLayout>;
}
