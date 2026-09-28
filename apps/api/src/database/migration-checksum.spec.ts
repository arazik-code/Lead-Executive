import assert from 'node:assert/strict';
import test from 'node:test';
import { assertMigrationChecksum, migrationChecksum } from './migration-checksum';

test('migration checksums are stable SHA-256 hashes of the exact SQL',()=>{
  assert.equal(migrationChecksum('SELECT 1;'),migrationChecksum('SELECT 1;'));
  assert.notEqual(migrationChecksum('SELECT 1;'),migrationChecksum('SELECT 1 ;'));
});

test('migration history rejects edited applied SQL',()=>{
  const checksum=migrationChecksum('CREATE TABLE example(id uuid);');
  assert.doesNotThrow(()=>assertMigrationChecksum('001_example',checksum,checksum));
  assert.throws(()=>assertMigrationChecksum('001_example',checksum,migrationChecksum('CREATE TABLE example(id text);')),/create a new forward migration/);
});
