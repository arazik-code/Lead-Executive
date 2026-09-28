import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DatabaseService } from '../database/database.module';
import { AuthGuard, AuthenticatedRequest } from '../identity/auth.guard';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly database: DatabaseService) {}

  @Get('summary')
  async summary(@Req() request: AuthenticatedRequest) {
    const { id, role } = request.user;
    const organizationId = process.env.ORGANIZATION_ID;
    if (!organizationId) throw new Error('ORGANIZATION_ID must be configured');
    const scoped = `organization_id=$1 AND archived_at IS NULL AND ($2 IN ('admin','manager') OR assigned_to=$3::uuid OR created_by=$3)`;
    const [totals, stages, unread, recent, activities] = await Promise.all([
      this.database.query(`SELECT count(*)::int AS total,count(*) FILTER (WHERE created_at >= now()-interval '7 days')::int AS created_last_7_days,count(*) FILTER (WHERE status IN ('qualified','assigned','contacted','meeting_scheduled','won'))::int AS qualified_or_beyond,count(*) FILTER (WHERE status='won')::int AS won,count(*) FILTER (WHERE score IS NOT NULL)::int AS scored FROM leads WHERE ${scoped}`, [organizationId, role, id]),
      this.database.query(`SELECT status,count(*)::int AS count FROM leads WHERE ${scoped} GROUP BY status ORDER BY status`, [organizationId, role, id]),
      this.database.query(`SELECT count(*)::int AS unread_conversations,coalesce(sum(unread_count),0)::int AS unread_messages FROM conversations WHERE organization_id=$1 AND status='open' AND ($2 IN ('admin','manager') OR assigned_to=$3::uuid)`, [organizationId, role, id]),
      this.database.query(`SELECT id,name,status,score,source,created_at AS "createdAt",budget_amount AS "budgetAmount",budget_currency AS "budgetCurrency" FROM leads WHERE ${scoped} ORDER BY created_at DESC LIMIT 8`, [organizationId, role, id]),
      this.database.query(`SELECT a.event_type AS "eventType",a.entity_type AS "entityType",a.entity_id AS "entityId",a.payload,a.created_at AS "createdAt",u.display_name AS "actorName" FROM audit_events a LEFT JOIN users u ON u.id::text=a.actor_id AND u.organization_id=a.organization_id WHERE a.organization_id=$1 AND a.entity_type='lead' AND EXISTS (SELECT 1 FROM leads l WHERE l.id=a.entity_id AND l.organization_id=$1 AND l.archived_at IS NULL AND ($2 IN ('admin','manager') OR l.assigned_to=$3::uuid OR l.created_by=$3)) ORDER BY a.created_at DESC LIMIT 8`, [organizationId, role, id]),
    ]);
    return { metrics: totals.rows[0], stages: stages.rows, messaging: unread.rows[0], recentLeads: recent.rows, recentActivity: activities.rows };
  }
}
