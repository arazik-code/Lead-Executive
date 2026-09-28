import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Pool } from 'pg';
import { assertMigrationChecksum, migrationChecksum } from './migration-checksum';

async function migrate() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be configured');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(740021)');
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now(), checksum text)');
    await client.query('ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS checksum text');
    const migrationsDir = join(__dirname, '../../migrations');
    const versions = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();
    let lastApplied = 'none';
    for (const file of versions) {
      const version = file.replace(/\.sql$/, '');
      const sql = await readFile(join(migrationsDir, file), 'utf8');
      const checksum=migrationChecksum(sql);
      const applied = await client.query<{checksum:string|null}>('SELECT checksum FROM schema_migrations WHERE version = $1', [version]);
      if (applied.rows[0]) {
        if(applied.rows[0].checksum)assertMigrationChecksum(version,applied.rows[0].checksum,checksum);
        else {
          console.warn(`Backfilled checksum for legacy migration ${version}; its previously applied SQL cannot be independently verified.`);
          await client.query('UPDATE schema_migrations SET checksum=$1 WHERE version=$2 AND checksum IS NULL',[checksum,version]);
        }
        lastApplied = version;
        continue;
      }
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(version,checksum) VALUES ($1,$2)', [version,checksum]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
      lastApplied = version;
    }
    console.log(`Database migrations applied through ${lastApplied}`);
  } finally {
    await client.query('SELECT pg_advisory_unlock(740021)');
    client.release();
    await pool.end();
  }
}

void migrate().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
