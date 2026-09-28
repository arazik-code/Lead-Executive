import { Module } from '@nestjs/common';
import { AuthModule } from '../identity/auth.module';
import { RoutingController } from './routing.controller';
import { RoutingService } from './routing.service';
import { OperationsModule } from '../operations/operations.module';

@Module({ imports: [AuthModule,OperationsModule], controllers: [RoutingController], providers: [RoutingService] })
export class RoutingModule {}
