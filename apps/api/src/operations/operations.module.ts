import { Module } from '@nestjs/common';
import { AuthModule } from '../identity/auth.module';
import { NotificationService } from './notification.service';
import { MembersController, NotificationsController, SearchController, SettingsController } from './operations.controller';
import { OperationsService } from './operations.service';

@Module({imports:[AuthModule],controllers:[SettingsController,NotificationsController,MembersController,SearchController],providers:[OperationsService,NotificationService],exports:[NotificationService]})
export class OperationsModule{}
