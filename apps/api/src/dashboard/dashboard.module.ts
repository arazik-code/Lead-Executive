import { Module } from '@nestjs/common';
import { AuthModule } from '../identity/auth.module';
import { DashboardController } from './dashboard.controller';

@Module({ imports: [AuthModule], controllers: [DashboardController] })
export class DashboardModule {}
