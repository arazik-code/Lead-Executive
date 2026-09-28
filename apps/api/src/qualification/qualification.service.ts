import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.module';
import { AuthenticatedUser } from '../identity/auth.guard';
import { calculateQualificationScore, classifyScore } from './scoring';
import { qualificationAnswersSchema, qualificationFormSchema, QualificationForm } from './qualification.schema';

@Injectable()
export class QualificationService {
  constructor(private readonly database: DatabaseService) {}

  async activeForm() {
    const result = await this.database.query(
      `SELECT id, version, form, published_at AS "publishedAt" FROM qualification_form_versions WHERE organization_id=$1 AND state='published'`,
      [this.organizationId],
    );
    return result.rows[0] ?? null;
  }

  async versions(actor: AuthenticatedUser) {
    this.assertAdmin(actor);
    const result = await this.database.query(`SELECT id,version,state,form,created_at AS "createdAt",published_at AS "publishedAt" FROM qualification_form_versions WHERE organization_id=$1 ORDER BY version DESC`, [this.organizationId]);
    return { data: result.rows };
  }

  async getVersion(actor: AuthenticatedUser, formId: string) {
    this.assertAdmin(actor);
    const result = await this.database.query(`SELECT id,version,state,form,created_at AS "createdAt",published_at AS "publishedAt" FROM qualification_form_versions WHERE id=$1 AND organization_id=$2`, [formId, this.organizationId]);
    return result.rows[0] ?? null;
  }

  async createDraft(actor: AuthenticatedUser, rawForm: unknown) {
    this.assertAdmin(actor);
    const form = this.parseForm(rawForm);
    return this.database.transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [this.organizationId]);
      const current = await client.query<{ version: number }>(`SELECT COALESCE(MAX(version),0)::int AS version FROM qualification_form_versions WHERE organization_id=$1`, [this.organizationId]);
      const result = await client.query(
        `INSERT INTO qualification_form_versions (organization_id,version,state,form,created_by) VALUES ($1,$2,'draft',$3::jsonb,$4) RETURNING id,version,state,form,created_at AS "createdAt"`,
        [this.organizationId, current.rows[0].version + 1, JSON.stringify(form), actor.id],
      );
      await client.query(
        `INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,$2,'qualification.form_draft_created','qualification_form',$3,$4::jsonb)`,
        [this.organizationId, actor.id, result.rows[0].id, JSON.stringify({ version: result.rows[0].version })],
      );
      return result.rows[0];
    });
  }

  async publish(actor: AuthenticatedUser, formId: string) {
    this.assertAdmin(actor);
    return this.database.transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [this.organizationId]);
      const draft = await client.query(`SELECT id,version FROM qualification_form_versions WHERE id=$1 AND organization_id=$2 AND state='draft' FOR UPDATE`, [formId, this.organizationId]);
      if (!draft.rows[0]) return null;
      await client.query(`UPDATE qualification_form_versions SET state='retired' WHERE organization_id=$1 AND state='published'`, [this.organizationId]);
      const result = await client.query(
        `UPDATE qualification_form_versions SET state='published',published_at=now() WHERE id=$1 AND organization_id=$2 RETURNING id,version,state,form,published_at AS "publishedAt"`,
        [formId, this.organizationId],
      );
      await client.query(
        `INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,$2,'qualification.form_published','qualification_form',$3,$4::jsonb)`,
        [this.organizationId, actor.id, formId, JSON.stringify({ version: draft.rows[0].version })],
      );
      return result.rows[0];
    });
  }

  async submitAnswers(actor: AuthenticatedUser, leadId: string, rawAnswers: unknown, idempotencyKey?: string) {
    const parsedAnswers = qualificationAnswersSchema.safeParse(rawAnswers);
    if (!parsedAnswers.success) throw new BadRequestException(parsedAnswers.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`));
    const answers = parsedAnswers.data;
    if (idempotencyKey !== undefined && (idempotencyKey.length < 8 || idempotencyKey.length > 128)) throw new BadRequestException('Idempotency-Key must be 8 to 128 characters');
    return this.database.transaction(async (client) => {
      const lead = await client.query<{ id: string }>(
        `SELECT id FROM leads WHERE id=$1 AND organization_id=$2 AND archived_at IS NULL AND ($3 IN ('admin','manager') OR assigned_to=$4::uuid OR created_by=$5) FOR UPDATE`,
        [leadId, this.organizationId, actor.role, actor.id, actor.id],
      );
      if (!lead.rows[0]) return null;
      if (idempotencyKey) {
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${this.organizationId}:${idempotencyKey}`]);
        const prior = await client.query<{ lead_id: string; response_json: unknown }>(
          `SELECT lead_id,response_json FROM lead_answers WHERE organization_id=$1 AND idempotency_key=$2`,
          [this.organizationId, idempotencyKey],
        );
        if (prior.rows[0]) {
          if (prior.rows[0].lead_id !== leadId) throw new ConflictException('Idempotency-Key has already been used for another lead');
          if (prior.rows[0].response_json) return prior.rows[0].response_json;
        }
      }
      const active = await client.query<{ id: string; version: number; form: QualificationForm }>(
        `SELECT id,version,form FROM qualification_form_versions WHERE organization_id=$1 AND state='published' FOR SHARE`,
        [this.organizationId],
      );
      if (!active.rows[0]) throw new BadRequestException('No published qualification form is configured');
      const form = this.parseForm(active.rows[0].form);
      const questionIds = new Set(form.questions.filter((question) => question.enabled).map((question) => question.id));
      const unknown = Object.keys(answers).filter((id) => !questionIds.has(id));
      if (unknown.length) throw new BadRequestException(`Answers include unknown or disabled question IDs: ${unknown.join(', ')}`);
      let score: ReturnType<typeof calculateQualificationScore>;
      try {
        score = calculateQualificationScore(form.questions, answers);
      } catch (error) {
        throw new BadRequestException(error instanceof Error ? error.message : 'Answers could not be scored');
      }
      const tier = classifyScore(score.score, form.thresholds.mediumMinimum, form.thresholds.highMinimum);
      const attempt = await client.query<{ attempt: number }>(
        `SELECT COALESCE(MAX(attempt),0)::int+1 AS attempt FROM lead_answers WHERE organization_id=$1 AND lead_id=$2 AND form_version_id=$3`,
        [this.organizationId, leadId, active.rows[0].id],
      );
      const answerRow = await client.query(
        `INSERT INTO lead_answers (organization_id,lead_id,form_version_id,attempt,answers,submitted_by,idempotency_key) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7) RETURNING id,attempt,submitted_at AS "submittedAt"`,
        [this.organizationId, leadId, active.rows[0].id, attempt.rows[0].attempt, JSON.stringify(answers), actor.id, idempotencyKey ?? null],
      );
      const snapshot = await client.query(
        `INSERT INTO qualification_score_snapshots (organization_id,lead_id,form_version_id,score,completion_rate,scoring_version,breakdown) VALUES ($1,$2,$3,$4,$5,1,$6::jsonb) RETURNING id,score,completion_rate AS "completionRate",calculated_at AS "calculatedAt"`,
        [this.organizationId, leadId, active.rows[0].id, score.score, score.completionRate, JSON.stringify(score)],
      );
      await client.query(`UPDATE leads SET score=$1,score_updated_at=now(),updated_at=now() WHERE id=$2 AND organization_id=$3`, [score.score, leadId, this.organizationId]);
      const result = { answer: answerRow.rows[0], score: snapshot.rows[0], tier, formVersion: active.rows[0].version, breakdown: score };
      if (idempotencyKey) await client.query('UPDATE lead_answers SET response_json=$1::jsonb WHERE id=$2', [JSON.stringify(result), answerRow.rows[0].id]);
      await client.query(
        `INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,$2,'qualification.answers_scored','lead',$3,$4::jsonb)`,
        [this.organizationId, actor.id, leadId, JSON.stringify({ formVersion: active.rows[0].version, score: score.score, tier, completionRate: score.completionRate })],
      );
      return result;
    });
  }

  private parseForm(value: unknown): QualificationForm {
    const parsed = qualificationFormSchema.safeParse(value);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`));
    return parsed.data;
  }

  private assertAdmin(actor: AuthenticatedUser) {
    if (!['admin', 'manager'].includes(actor.role)) throw new ForbiddenException('Only admins and managers can change qualification settings');
  }

  private get organizationId() {
    const id = process.env.ORGANIZATION_ID;
    if (!id) throw new Error('ORGANIZATION_ID must be configured');
    return id;
  }
}
