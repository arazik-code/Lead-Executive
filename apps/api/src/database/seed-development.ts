import 'dotenv/config';
import { Pool } from 'pg';

async function seedDevelopmentIdentity() {
  if (process.env.AUTH_MODE !== 'development' || process.env.NODE_ENV === 'production') {
    throw new Error('Development seeding is only allowed with AUTH_MODE=development outside production');
  }
  const organizationId = process.env.ORGANIZATION_ID;
  if (!organizationId || !process.env.DATABASE_URL) throw new Error('ORGANIZATION_ID and DATABASE_URL must be configured');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO organizations(id,name) VALUES ($1,'Executive Lead Control') ON CONFLICT (id) DO NOTHING`,
      [organizationId],
    );
    const member = await client.query<{ id: string }>(
      `INSERT INTO users(id,organization_id,auth_subject,email,display_name,role,active)
       VALUES ('00000000-0000-4000-8000-000000000002',$1,'local-admin','local-admin@development.invalid','Local Development Admin','admin',true)
       ON CONFLICT (auth_subject) DO UPDATE SET organization_id=EXCLUDED.organization_id,active=true
       RETURNING id`,
      [organizationId],
    );
    await client.query(
      `INSERT INTO agent_profiles(organization_id,user_id) VALUES ($1,$2) ON CONFLICT (organization_id,user_id) DO NOTHING`,
      [organizationId, member.rows[0].id],
    );
    await client.query('COMMIT');
    console.log('Provisioned the local development identity');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

void seedDevelopmentIdentity().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
