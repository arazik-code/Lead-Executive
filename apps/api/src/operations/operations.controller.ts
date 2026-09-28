import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsEmail, IsIn, IsInt, IsObject, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { AuthGuard, AuthenticatedRequest } from '../identity/auth.guard';
import { OperationsService } from './operations.service';

class OrganizationSettingsDto {
  @IsInt() @Min(1) expectedVersion!: number;
  @IsString() @MinLength(2) @MaxLength(120) organizationName!: string;
  @IsIn(['AED','USD','EUR','GBP']) defaultCurrency!: string;
}
class PreferencesDto {
  @IsInt() @Min(0) expectedVersion!: number;
  @IsObject() preferences!: Record<string, unknown>;
}
class CreateMemberDto {
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @MinLength(2) @MaxLength(120) displayName!: string;
  @IsIn(['admin','manager','agent']) role!: 'admin'|'manager'|'agent';
}
class UpdateMemberDto {
  @IsString() @MinLength(2) @MaxLength(120) displayName!: string;
  @IsIn(['admin','manager','agent']) role!: 'admin'|'manager'|'agent';
  @IsBoolean() active!: boolean;
}

@Controller('search')
@UseGuards(AuthGuard)
export class SearchController {
  constructor(private readonly operations:OperationsService){}
  @Get() search(@Req() request:AuthenticatedRequest,@Query('q') query?:string){return this.operations.search(request.user,query);}
}

@Controller('settings')
@UseGuards(AuthGuard)
export class SettingsController {
  constructor(private readonly operations:OperationsService){}
  @Get() get(){return this.operations.getSettings();}
  @Patch('organization') async updateOrganization(@Req() request:AuthenticatedRequest,@Body() input:OrganizationSettingsDto){return this.operations.updateOrganizationSettings(request.user,input);}
  @Get('preferences') preferences(@Req() request:AuthenticatedRequest){return this.operations.getPreferences(request.user);}
  @Patch('preferences') updatePreferences(@Req() request:AuthenticatedRequest,@Body() input:PreferencesDto){return this.operations.updatePreferences(request.user,input);}
}

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly operations:OperationsService){}
  @Get() list(@Req() request:AuthenticatedRequest,@Query('limit') limit?:string){return this.operations.listNotifications(request.user,limit);}
  @Post('read-all') markAll(@Req() request:AuthenticatedRequest){return this.operations.markAllNotificationsRead(request.user);}
  @Patch(':id/read') async markRead(@Req() request:AuthenticatedRequest,@Param('id',ParseUUIDPipe) id:string){const result=await this.operations.markNotificationRead(request.user,id);if(!result)throw new NotFoundException('Notification not found');return result;}
}

@Controller('organization/members')
@UseGuards(AuthGuard)
export class MembersController {
  constructor(private readonly operations:OperationsService){}
  @Get() list(@Req() request:AuthenticatedRequest){return this.operations.listMembers(request.user);}
  @Post() create(@Req() request:AuthenticatedRequest,@Body() input:CreateMemberDto){return this.operations.createMember(request.user,input);}
  @Patch(':id') update(@Req() request:AuthenticatedRequest,@Param('id',ParseUUIDPipe) id:string,@Body() input:UpdateMemberDto){return this.operations.updateMember(request.user,id,input);}
}
