import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.module';
import { AuthenticatedUser } from '../identity/auth.guard';
import { normalizeLeadPhone, validateBudget } from './lead-input';
import { NotificationService } from '../operations/notification.service';

export interface LeadImportRow { rowNumber: number; name: string; phone: string; email?: string; source?: string; notes?: string; intent?: string; timeline?: string; region?: string; propertyType?: string; budgetCurrency?: string; budgetAmount?: number; }
interface NormalizedRow extends LeadImportRow { phone: string; email?: string; source: string; }
type RowResult = { rowNumber: number; status: 'ready' | 'invalid' | 'duplicate'; issues: string[]; duplicateLeadId?: string; duplicateRowNumber?: number; normalized?: NormalizedRow };

@Injectable()
export class LeadImportService {
  constructor(private readonly database: DatabaseService,private readonly notifications:NotificationService) {}

  async preview(actor: AuthenticatedUser, rows: LeadImportRow[]) {
    this.assertManager(actor);
    if (!rows.length || rows.length > 500) throw new BadRequestException('Import must contain between 1 and 500 data rows');
    const result = rows.map((row) => this.normalize(row));
    const byPhone = new Map<string, RowResult>();
    for (const item of result) {
      if (!item.normalized) continue;
      const previous = byPhone.get(item.normalized.phone);
      if (previous) { item.status = 'duplicate'; item.duplicateRowNumber = previous.rowNumber; item.issues.push(`Duplicate of row ${previous.rowNumber} in this file`); }
      else byPhone.set(item.normalized.phone, item);
    }
    const phones = [...byPhone.keys()];
    if (phones.length) {
      const existing = await this.database.query<{ id: string; phone: string }>(`SELECT id,phone FROM leads WHERE organization_id=$1 AND archived_at IS NULL AND phone=ANY($2::text[])`, [this.organizationId, phones]);
      const matches = new Map(existing.rows.map((lead) => [lead.phone, lead.id]));
      for (const item of result) {
        const match = item.normalized && matches.get(item.normalized.phone);
        if (match) { item.status = 'duplicate'; item.duplicateLeadId = match; item.issues.push('An active lead with this phone number already exists'); }
      }
    }
    return { rows: result.map(({ normalized, ...item }) => ({ ...item, ...(item.status === 'ready' && normalized ? { normalized } : {}) })), summary: { total: result.length, ready: result.filter((item) => item.status === 'ready').length, duplicates: result.filter((item) => item.status === 'duplicate').length, invalid: result.filter((item) => item.status === 'invalid').length } };
  }

  async importSelected(actor: AuthenticatedUser, input: { rows: LeadImportRow[]; selectedRowNumbers: number[]; sourceName: string }) {
    this.assertManager(actor);
    if (input.rows.length < 1 || input.rows.length > 500) throw new BadRequestException('Import must contain between 1 and 500 data rows');
    const selected = new Set(input.selectedRowNumbers);
    const suppliedRows = new Set(input.rows.map((row) => row.rowNumber));
    if (selected.size !== input.selectedRowNumbers.length || selected.size > 500 || [...selected].some((value) => !Number.isInteger(value) || !suppliedRows.has(value))) throw new BadRequestException('Selected row numbers are invalid');
    const normalizedResults = input.rows.map((row) => this.normalize(row));
    const candidates = normalizedResults.filter((item) => selected.has(item.rowNumber));
    const seen = new Set<string>();
    return this.database.transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [this.organizationId]);
      const imported: Array<{ rowNumber: number; leadId: string }> = [];
      const skipped: Array<{ rowNumber: number; reason: string }> = [];
      for (const item of candidates) {
        if (item.status !== 'ready' || !item.normalized) { skipped.push({ rowNumber: item.rowNumber, reason: item.issues.join('; ') || 'Invalid row' }); continue; }
        const row = item.normalized;
        if (seen.has(row.phone)) { skipped.push({ rowNumber: row.rowNumber, reason: 'Duplicate phone number in selected rows' }); continue; }
        seen.add(row.phone);
        const id = randomUUID();
        const created = await client.query<{ id: string }>(
          `INSERT INTO leads (id,organization_id,name,phone,email,source,notes,intent,timeline,region,property_type,budget_amount,budget_currency,created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
           ON CONFLICT (organization_id,phone) WHERE archived_at IS NULL DO NOTHING RETURNING id`,
          [id,this.organizationId,row.name.trim(),row.phone,row.email ?? null,row.source,row.notes ?? null,row.intent ?? null,row.timeline ?? null,row.region ?? null,row.propertyType ?? null,row.budgetAmount ?? null,row.budgetCurrency ?? null,actor.id],
        );
        if (!created.rows[0]) { skipped.push({ rowNumber: row.rowNumber, reason: 'An active lead with this phone number already exists' }); continue; }
        await client.query(`INSERT INTO lead_stage_transitions (organization_id,lead_id,from_status,to_status,reason,actor_id) VALUES ($1,$2,NULL,'new',$3,$4)`, [this.organizationId,id,'CSV import',actor.id]);
        await client.query(`INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,$2,'lead.imported','lead',$3,$4::jsonb)`, [this.organizationId,actor.id,id,JSON.stringify({ importFile: input.sourceName.slice(0,160), rowNumber: row.rowNumber, source: row.source })]);
        imported.push({ rowNumber: row.rowNumber, leadId: id });
      }
      const batchId=randomUUID();
      await client.query(`INSERT INTO audit_events (organization_id,actor_id,event_type,entity_type,entity_id,payload) VALUES ($1,$2,'lead.import_batch','lead_import',$3,$4::jsonb)`, [this.organizationId,actor.id,batchId,JSON.stringify({ sourceName: input.sourceName.slice(0,160), selected: candidates.length, imported: imported.length, skipped: skipped.length })]);
      if(imported.length)await this.notifications.forManagers(client,{organizationId:this.organizationId,actorId:actor.id,eventKey:`lead-import-batch:${batchId}`,eventType:'lead.import_completed',title:'Lead import completed',body:`${imported.length} lead${imported.length===1?'':'s'} imported successfully.`,link:'/leads',entityType:'lead_import',entityId:batchId,preference:'newLead'});
      return { imported, skipped, summary: { selected: candidates.length, imported: imported.length, skipped: skipped.length } };
    });
  }

  private normalize(row: LeadImportRow): RowResult {
    const issues: string[] = [];
    const normalized: NormalizedRow = { ...row, phone: typeof row.phone === 'string' ? row.phone.trim() : '', source: row.source?.trim() || 'CSV import' };
    if (!Number.isInteger(row.rowNumber) || row.rowNumber < 2) issues.push('Row number must be an integer at least 2');
    if (!row.name?.trim() || row.name.trim().length > 160) issues.push('Name is required and must be at most 160 characters');
    if (typeof row.phone !== 'string') issues.push('Phone is required');
    else { try { normalized.phone = normalizeLeadPhone(row.phone); } catch { issues.push('Enter a valid phone number; UAE local numbers are supported'); } }
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) issues.push('Email address is invalid');
    if (row.email) normalized.email = row.email.trim().toLowerCase();
    if (row.source && row.source.length > 500) issues.push('Source must be at most 500 characters');
    if (row.notes && row.notes.length > 2000) issues.push('Notes must be at most 2000 characters');
    if ([row.intent,row.timeline,row.region,row.propertyType].some((value) => value !== undefined && value.length > 120)) issues.push('Intent, timeline, region, and property type must be at most 120 characters');
    if (row.budgetAmount !== undefined || row.budgetCurrency !== undefined) {
      try { validateBudget(row.budgetAmount, row.budgetCurrency); }
      catch { issues.push('Budget amount and currency must be provided together'); }
      if (row.budgetAmount !== undefined && (!Number.isFinite(row.budgetAmount) || row.budgetAmount < 0 || row.budgetAmount > 100000000000)) issues.push('Budget amount must be between 0 and 100,000,000,000');
      if (row.budgetCurrency !== undefined && !['AED','USD','EUR','GBP'].includes(row.budgetCurrency)) issues.push('Budget currency must be AED, USD, EUR, or GBP');
    }
    return { rowNumber: row.rowNumber, status: issues.length ? 'invalid' : 'ready', issues, ...(issues.length ? {} : { normalized }) };
  }

  private assertManager(actor: AuthenticatedUser) { if (!['admin','manager'].includes(actor.role)) throw new ForbiddenException('Only admins and managers can import leads'); }
  private get organizationId() { const value = process.env.ORGANIZATION_ID; if (!value) throw new Error('ORGANIZATION_ID must be configured'); return value; }
}
