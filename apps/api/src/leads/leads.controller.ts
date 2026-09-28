import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { AuthGuard, AuthenticatedRequest } from '../identity/auth.guard';
import { LeadImportRow, LeadImportService } from './lead-import.service';
import { LeadsService } from './leads.service';

class LeadImportRowDto implements LeadImportRow {
  @IsInt() @Min(2) rowNumber!: number;
  @IsString() @MinLength(1) @MaxLength(160) name!: string;
  @IsString() @MinLength(1) @MaxLength(32) phone!: string;
  @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @IsOptional() @IsString() @MaxLength(500) source?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsString() @MaxLength(120) intent?: string;
  @IsOptional() @IsString() @MaxLength(120) timeline?: string;
  @IsOptional() @IsString() @MaxLength(120) region?: string;
  @IsOptional() @IsString() @MaxLength(120) propertyType?: string;
  @IsOptional() @IsIn(['AED','USD','EUR','GBP']) budgetCurrency?: string;
  @IsOptional() @IsNumber({ allowInfinity: false, allowNaN: false }) @Min(0) @Max(100000000000) budgetAmount?: number;
}

class LeadImportRowsDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500) @ValidateNested({ each: true }) @Type(() => LeadImportRowDto) rows!: LeadImportRowDto[];
}

class CommitLeadImportDto extends LeadImportRowsDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500) @IsInt({ each: true }) selectedRowNumbers!: number[];
  @IsString() @MinLength(1) @MaxLength(160) sourceName!: string;
}

class ExportLeadsDto {
  @IsOptional() @IsString() @MaxLength(120) search?: string;
  @IsOptional() @IsIn(['new','qualifying','qualified','assigned','contacted','meeting_scheduled','nurture','won','lost']) status?: string;
}

class CreateLeadDto {
  @IsString() @MinLength(1) @MaxLength(160) name!: string;
  @IsString() @MinLength(5) @MaxLength(32) phone!: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(500) source?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsString() @MaxLength(120) intent?: string;
  @IsOptional() @IsString() @MaxLength(120) timeline?: string;
  @IsOptional() @IsString() @MaxLength(120) region?: string;
  @IsOptional() @IsString() @MaxLength(120) propertyType?: string;
  @IsOptional() @IsIn(['AED', 'USD', 'EUR', 'GBP']) budgetCurrency?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100000000000) budgetAmount?: number;
}

class ChangeStatusDto {
  @IsIn(['new', 'qualifying', 'qualified', 'assigned', 'contacted', 'meeting_scheduled', 'nurture', 'won', 'lost']) status!: string;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
class AssignLeadDto {
  @IsUUID() agentId!: string;
  @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}

class UpdateLeadDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MinLength(5) @MaxLength(32) phone?: string;
  @IsOptional() @IsEmail() email?: string | null;
  @IsOptional() @IsString() @MaxLength(500) source?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string | null;
  @IsOptional() @IsString() @MaxLength(120) intent?: string | null;
  @IsOptional() @IsString() @MaxLength(120) timeline?: string | null;
  @IsOptional() @IsString() @MaxLength(120) region?: string | null;
  @IsOptional() @IsString() @MaxLength(120) propertyType?: string | null;
  @IsOptional() @IsIn(['AED', 'USD', 'EUR', 'GBP']) budgetCurrency?: string | null;
  @IsOptional() @IsNumber() @Min(0) @Max(100000000000) budgetAmount?: number | null;
}

@Controller('leads')
@UseGuards(AuthGuard)
export class LeadsController {
  constructor(private readonly leads: LeadsService, private readonly imports: LeadImportService) {}

  @Post('export')
  export(@Req() request: AuthenticatedRequest, @Body() input: ExportLeadsDto) {
    return this.leads.exportRecords(request.user, input.search, input.status);
  }

  @Post('import/preview')
  previewImport(@Req() request: AuthenticatedRequest, @Body() input: LeadImportRowsDto) {
    return this.imports.preview(request.user, input.rows);
  }

  @Post('import/commit')
  commitImport(@Req() request: AuthenticatedRequest, @Body() input: CommitLeadImportDto) {
    return this.imports.importSelected(request.user, input);
  }

  @Get()
  list(@Req() request: AuthenticatedRequest, @Query('limit') limit?: string, @Query('offset') offset?: string, @Query('q') search?: string, @Query('status') status?: string) {
    return this.leads.list(request.user, limit, offset, search, status);
  }

  @Get('assignees') assignees(@Req() request:AuthenticatedRequest){return this.leads.assignees(request.user);}

  @Get(':id/activity')
  async activity(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const activity = await this.leads.activity(request.user, id);
    if (!activity) throw new NotFoundException('Lead not found');
    return activity;
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateLeadDto) {
    return this.leads.create(request.user.id, input);
  }

  @Patch(':id')
  async update(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: UpdateLeadDto) {
    const lead = await this.leads.update(request.user, id, input);
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  @Post(':id/archive')
  async archive(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const lead = await this.leads.archive(request.user, id);
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  @Patch(':id/status')
  async changeStatus(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: ChangeStatusDto) {
    const lead = await this.leads.changeStatus(request.user, id, input.status, input.reason);
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  @Post(':id/assign-self')
  async assignSelf(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const lead = await this.leads.assignToSelf(request.user, id);
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  @Post(':id/assign')
  async assign(@Req() request:AuthenticatedRequest,@Param('id',ParseUUIDPipe) id:string,@Body() input:AssignLeadDto){
    const lead=await this.leads.assign(request.user,id,input.agentId,input.reason);
    if(!lead)throw new NotFoundException('Lead not found');
    return lead;
  }
}
