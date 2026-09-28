import { BadRequestException, Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { DatabaseService } from '../database/database.module';
import { AuthGuard, AuthenticatedRequest } from '../identity/auth.guard';

export function parseAnalyticsRange(fromValue?: string, toValue?: string) {
  const from = fromValue ?? new Date(Date.now() - 29 * 86400000).toISOString().slice(0,10);
  const to = toValue ?? new Date().toISOString().slice(0,10);
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0,10) === value;
  if (!validDate(from) || !validDate(to)) throw new BadRequestException('from and to must be valid ISO dates (YYYY-MM-DD)');
  const start = Date.parse(`${from}T00:00:00.000Z`);
  const endExclusive = Date.parse(`${to}T00:00:00.000Z`) + 86400000;
  const days = (endExclusive - start) / 86400000;
  if (days < 1 || days > 366) throw new BadRequestException('Analytics date range must contain 1 to 366 days');
  return { from, to, days, start: new Date(start).toISOString(), endExclusive: new Date(endExclusive).toISOString() };
}

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly database: DatabaseService) {}

  @Get('overview')
  async overview(@Req() request: AuthenticatedRequest, @Query('from') from?: string, @Query('to') to?: string) {
    const range = parseAnalyticsRange(from,to);
    const { id, role } = request.user;
    const organizationId = process.env.ORGANIZATION_ID;
    if (!organizationId) throw new Error('ORGANIZATION_ID must be configured');
    const scope = `l.organization_id=$1 AND l.archived_at IS NULL AND l.created_at >= $4::timestamptz AND l.created_at < $5::timestamptz AND ($2 IN ('admin','manager') OR l.assigned_to=$3::uuid OR l.created_by=$3)`;
    const params = [organizationId,role,id,range.start,range.endExclusive];
    const [metrics,daily,sources,stages] = await Promise.all([
      this.database.query(
        `WITH cohort AS (SELECT l.id,l.status FROM leads l WHERE ${scope})
         SELECT count(*)::int AS "newLeads",
           count(*) FILTER (WHERE c.status IN ('qualified','assigned','contacted','meeting_scheduled','won'))::int AS "currentlyQualifiedOrBeyond",
           count(*) FILTER (WHERE c.status='won')::int AS "currentlyWon",
           count(*) FILTER (WHERE EXISTS (SELECT 1 FROM lead_stage_transitions t WHERE t.organization_id=$1 AND t.lead_id=c.id AND t.to_status IN ('qualified','assigned','contacted','meeting_scheduled','won')) )::int AS "everQualified",
           count(*) FILTER (WHERE EXISTS (SELECT 1 FROM lead_stage_transitions t WHERE t.organization_id=$1 AND t.lead_id=c.id AND t.to_status='won'))::int AS "everWon"
         FROM cohort c`,params),
      this.database.query(
        `SELECT to_char(date_trunc('day',l.created_at AT TIME ZONE 'UTC'),'YYYY-MM-DD') AS date,count(*)::int AS count FROM leads l WHERE ${scope} GROUP BY 1 ORDER BY 1`,params),
      this.database.query(
        `SELECT COALESCE(NULLIF(btrim(l.source),''),'Unknown') AS source,count(*)::int AS count FROM leads l WHERE ${scope} GROUP BY 1 ORDER BY count(*) DESC,source LIMIT 10`,params),
      this.database.query(
        `SELECT l.status,count(*)::int AS count FROM leads l WHERE ${scope} GROUP BY l.status ORDER BY l.status`,params),
    ]);
    return { range: { from: range.from,to: range.to,timezone: 'UTC',days: range.days }, metrics: metrics.rows[0], daily: daily.rows, sources: sources.rows, currentStages: stages.rows };
  }
}
