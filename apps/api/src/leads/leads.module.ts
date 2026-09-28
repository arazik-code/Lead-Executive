import { Module } from '@nestjs/common';
import { AuthModule } from '../identity/auth.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { LeadImportService } from './lead-import.service';
import { OperationsModule } from '../operations/operations.module';

@Module({ imports: [AuthModule,OperationsModule], controllers: [LeadsController], providers: [LeadsService, LeadImportService] })
export class LeadsModule {}
