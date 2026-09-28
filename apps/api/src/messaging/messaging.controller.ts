import { Body, Controller, Get, Headers, HttpCode, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Request } from 'express';
import { AuthGuard, AuthenticatedRequest } from '../identity/auth.guard';
import { MessagingService } from './messaging.service';
import { verifyWhatsAppSignature } from './whatsapp-signature';

class SendMessageDto {
  @IsString() @MinLength(1) @MaxLength(4096) content!: string;
}

class ConsentDto {
  @IsIn(['opted_in', 'opted_out']) consent!: 'opted_in' | 'opted_out';
  @IsString() @MinLength(3) @MaxLength(300) evidenceSource!: string;
}
class AssignConversationDto {
  @IsUUID() agentId!: string;
  @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}
class UnassignConversationDto {
  @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}

@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  constructor(private readonly messaging: MessagingService) {}

  @Get()
  verify(@Query('hub.mode') mode?: string, @Query('hub.verify_token') token?: string, @Query('hub.challenge') challenge?: string) {
    return this.messaging.verifyChallenge(mode, token, challenge);
  }

  @Get('assignees') assignees(@Req() request:AuthenticatedRequest){return this.messaging.listAssignees(request.user);}

  @Post()
  @HttpCode(200)
  receive(@Req() request: RawBodyRequest<Request>, @Headers('x-hub-signature-256') signature: string | undefined, @Body() payload: unknown) {
    if (!request.rawBody || !verifyWhatsAppSignature(request.rawBody, signature, process.env.WHATSAPP_APP_SECRET)) {
      return this.messaging.rejectInvalidSignature();
    }
    return this.messaging.handleWebhook(request.rawBody, payload);
  }
}

@Controller('conversations')
@UseGuards(AuthGuard)
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest, @Query('limit') limit?: string) {
    return this.messaging.listConversations(request.user, limit);
  }

  @Get(':id/messages')
  async messages(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Query('limit') limit?: string) {
    const result = await this.messaging.listMessages(request.user, id, limit);
    if (!result) throw new NotFoundException('Conversation not found');
    return result;
  }

  @Post(':id/messages')
  async send(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: SendMessageDto) {
    const result = await this.messaging.queueMessage(request.user, id, input.content);
    if (!result) throw new NotFoundException('Conversation not found');
    return result;
  }

  @Post(':id/read')
  async markRead(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const result = await this.messaging.markRead(request.user, id);
    if (!result) throw new NotFoundException('Conversation not found');
    return result;
  }

  @Post(':id/archive')
  async archive(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const result = await this.messaging.archive(request.user, id);
    if (!result) throw new NotFoundException('Conversation not found');
    return result;
  }

  @Patch(':id/consent')
  async consent(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: ConsentDto) {
    const result = await this.messaging.updateConsent(request.user, id, input.consent, input.evidenceSource);
    if (!result) throw new NotFoundException('Conversation not found');
    return result;
  }

  @Patch(':id/assignment')
  async assign(@Req() request:AuthenticatedRequest,@Param('id',ParseUUIDPipe) id:string,@Body() input:AssignConversationDto){const result=await this.messaging.assignConversation(request.user,id,input.agentId,input.reason);if(!result)throw new NotFoundException('Conversation not found');return result;}

  @Post(':id/unassign')
  async unassign(@Req() request:AuthenticatedRequest,@Param('id',ParseUUIDPipe) id:string,@Body() input:UnassignConversationDto){const result=await this.messaging.assignConversation(request.user,id,null,input.reason);if(!result)throw new NotFoundException('Conversation not found');return result;}
}
