import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';

@Injectable()
export class NotificationService {
  async forUser(client: PoolClient, input: { organizationId: string; userId: string; eventKey: string; eventType: string; title: string; body: string; link: string; entityType: string; entityId: string; preference: string }) {
    await client.query(
      `INSERT INTO user_notifications (organization_id,user_id,event_key,event_type,title,body,link,entity_type,entity_id)
       SELECT u.organization_id,u.id,$3,$4,$5,$6,$7,$8,$9 FROM users u
       WHERE u.organization_id=$1 AND u.id=$2 AND u.active=true
         AND COALESCE((SELECT (preferences->>$10)::boolean FROM user_notification_preferences WHERE organization_id=u.organization_id AND user_id=u.id),true)
       ON CONFLICT (organization_id,user_id,event_key) DO NOTHING`,
      [input.organizationId,input.userId,input.eventKey,input.eventType,input.title,input.body,input.link,input.entityType,input.entityId,input.preference],
    );
  }

  async forManagers(client: PoolClient, input: { organizationId: string; actorId: string | null; eventKey: string; eventType: string; title: string; body: string; link: string; entityType: string; entityId: string; preference: string }) {
    await client.query(
      `INSERT INTO user_notifications (organization_id,user_id,event_key,event_type,title,body,link,entity_type,entity_id)
       SELECT u.organization_id,u.id,$3,$4,$5,$6,$7,$8,$9 FROM users u
       WHERE u.organization_id=$1 AND u.active=true AND u.role IN ('admin','manager') AND ($2::uuid IS NULL OR u.id<>$2::uuid)
         AND COALESCE((SELECT (preferences->>$10)::boolean FROM user_notification_preferences WHERE organization_id=u.organization_id AND user_id=u.id),true)
       ON CONFLICT (organization_id,user_id,event_key) DO NOTHING`,
      [input.organizationId,input.actorId,input.eventKey,input.eventType,input.title,input.body,input.link,input.entityType,input.entityId,input.preference],
    );
  }
}
