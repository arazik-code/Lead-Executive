import { createHash } from 'node:crypto';

export function migrationChecksum(sql:string){return createHash('sha256').update(sql.replace(/\r\n/g,'\n'),'utf8').digest('hex');}

export function assertMigrationChecksum(version:string,storedChecksum:string,currentChecksum:string){
  if(storedChecksum!==currentChecksum)throw new Error(`Applied migration ${version} has changed. Restore the applied SQL or create a new forward migration.`);
}
