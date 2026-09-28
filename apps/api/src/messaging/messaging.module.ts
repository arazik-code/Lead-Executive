import { Module } from '@nestjs/common';
import { AuthModule } from '../identity/auth.module';
import { MessagingController, WhatsAppWebhookController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { OperationsModule } from '../operations/operations.module';

@Module({ imports: [AuthModule,OperationsModule], controllers: [MessagingController, WhatsAppWebhookController], providers: [MessagingService] })
export class MessagingModule {}
