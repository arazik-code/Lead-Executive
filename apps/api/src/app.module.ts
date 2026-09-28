import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { AuthModule } from './identity/auth.module';
import { LeadsModule } from './leads/leads.module';
import { QualificationModule } from './qualification/qualification.module';
import { RoutingModule } from './routing/routing.module';
import { MessagingModule } from './messaging/messaging.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { OperationsModule } from './operations/operations.module';

@Module({
  imports: [DatabaseModule, AuthModule, LeadsModule, QualificationModule, RoutingModule, MessagingModule, DashboardModule, AnalyticsModule, OperationsModule, ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }])],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
