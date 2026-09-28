import { ForbiddenException } from '@nestjs/common';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { DatabaseService } from '../database/database.module';
import { LeadImportService, LeadImportRow } from './lead-import.service';
import { NotificationService } from '../operations/notification.service';

process.env.ORGANIZATION_ID ??= '00000000-0000-4000-8000-000000000001';
const admin = { id:'agent-1',subject:'subject',email:'admin@example.com',role:'admin' as const };
function service(existing: Array<{ id:string; phone:string }> = []) {
  const database = { query: async () => ({ rows:existing }) } as unknown as DatabaseService;
  return new LeadImportService(database,new NotificationService());
}
const row = (rowNumber:number,phone:string,extra:Partial<LeadImportRow>={}):LeadImportRow => ({ rowNumber,name:`Lead ${rowNumber}`,phone,...extra });

test('lead import preview normalizes phone and detects duplicates within the uploaded file', async () => {
  const preview = await service().preview(admin,[row(2,'0501234567'),row(3,'+971501234567')]);
  assert.deepEqual(preview.summary,{total:2,ready:1,duplicates:1,invalid:0});
  assert.equal(preview.rows[0].status,'ready');
  assert.equal(preview.rows[1].status,'duplicate');
  assert.equal(preview.rows[1].duplicateRowNumber,2);
});

test('lead import preview identifies existing records and incomplete budgets without writing', async () => {
  const preview = await service([{id:'existing-lead',phone:'+971501234567'}]).preview(admin,[row(2,'0501234567'),row(3,'0509876543',{budgetAmount:1000})]);
  assert.equal(preview.rows[0].status,'duplicate');
  assert.equal(preview.rows[0].duplicateLeadId,'existing-lead');
  assert.equal(preview.rows[1].status,'invalid');
  assert.match(preview.rows[1].issues.join(' '),/Budget amount and currency/);
});

test('lead import preview is restricted to managers and admins', async () => {
  const agent = { ...admin, role:'agent' as const };
  await assert.rejects(()=>service().preview(agent,[row(2,'0501234567')]),ForbiddenException);
});
