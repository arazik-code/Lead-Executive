import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, CheckCircle2, CircleAlert, LockKeyhole, MessageSquareText, Users, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Readiness { status:'ok'|'unavailable';database:'ok'|'unavailable'; }
interface Settings { integrations:{googleWorkspace:boolean;whatsappCloud:boolean}; }

export default function ApiHelpPage(){
  const {apiBaseUrl,authHeaders,user}=useAuth();
  const readiness=useQuery({queryKey:['system-readiness'],retry:false,queryFn:async()=>{const response=await fetch(`${apiBaseUrl}/health/ready`,{headers:authHeaders()});const body=await response.json().catch(()=>({status:'unavailable',database:'unavailable'})) as Readiness;if(!response.ok)throw new Error(body.database==='unavailable'?'Database is unavailable. Contact your CRM administrator.':'CRM readiness check failed.');return body;}});
  const settings=useQuery({queryKey:['organization-settings'],queryFn:async()=>{const response=await fetch(`${apiBaseUrl}/settings`,{headers:authHeaders()});if(!response.ok)throw new Error('Integration status could not be loaded.');return response.json() as Promise<Settings>;}});
  const connected=readiness.data?.database==='ok';
  const areas=[
    {icon:Users,title:'Leads and pipeline',detail:'Create, search, edit, archive, import, and export lead records. Changes and lifecycle transitions are kept in the record activity history.'},
    {icon:Workflow,title:'Qualification and routing',detail:'Published forms and routing rules are versioned. Preview routing first; route actions are explicit and only accept qualified, unassigned leads.'},
    {icon:MessageSquareText,title:'WhatsApp inbox',detail:'Inbound messages arrive through the configured signed webhook. Replies require recorded opt-in and an open 24-hour service window. Managers can transfer inbox ownership.'},
    {icon:LockKeyhole,title:'Roles and access',detail:'Admins manage team membership. Managers can handle shared leads and conversations; agents see records assigned to them and records they created.'},
  ];
  return <MainLayout><div className="mx-auto max-w-5xl space-y-6">
    <PageHeader section="Operations guide" title="Know how the system behaves." description="Current feature behavior, access rules and integration readiness for this workspace." />
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base">System readiness {connected?<Badge><CheckCircle2 className="mr-1 h-3 w-3"/>Ready</Badge>:<Badge variant="destructive"><CircleAlert className="mr-1 h-3 w-3"/>Needs attention</Badge>}</CardTitle><CardDescription>{readiness.isLoading?'Checking the database connection…':readiness.error?.message??'The API and database are responding.'}</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{[{name:'Google Workspace',active:settings.data?.integrations.googleWorkspace},{name:'WhatsApp Cloud API',active:settings.data?.integrations.whatsappCloud}].map((item)=><div key={item.name} className="flex items-center justify-between rounded border p-3"><span className="text-sm">{item.name}</span><Badge variant={item.active?'default':'secondary'}>{item.active?'Configured':'Not configured'}</Badge></div>)}</CardContent></Card>
    <div className="grid gap-4 md:grid-cols-2">{areas.map((area)=><Card key={area.title}><CardHeader><CardTitle className="flex items-center gap-2 text-base"><area.icon className="h-4 w-4"/>{area.title}</CardTitle><CardDescription>{area.detail}</CardDescription></CardHeader></Card>)}</div>
    <Card><CardHeader><CardTitle className="text-base">Important operating rules</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p>CSV import previews validation and duplicates before commit. The CRM records source and import provenance; it does not infer consent or legal basis. Follow your organization’s approved policy before importing real prospect data.</p><p>Qualification scoring is deterministic and explainable, but its sample weights and thresholds need business approval and calibration. Do not interpret a score as an independently validated prediction.</p><p>Provider credentials are configured on the server. Never paste OAuth secrets, database passwords, or WhatsApp access tokens into CRM notes or support requests.</p><p>Signed in as {user?.email}. For role or integration changes, contact an organization admin.</p><Link to="/settings" className="inline-flex items-center gap-1 text-primary hover:underline">Open settings <ArrowUpRight className="h-3 w-3"/></Link></CardContent></Card>
  </div></MainLayout>;
}
