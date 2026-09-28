import { BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../identity/auth.guard';
import { QualificationService } from './qualification.service';

@Controller()
@UseGuards(AuthGuard)
export class QualificationController {
  constructor(private readonly qualification: QualificationService) {}

  @Get('qualification/forms/active') activeForm() { return this.qualification.activeForm(); }

  @Get('qualification/forms') versions(@Req() request: AuthenticatedRequest) { return this.qualification.versions(request.user); }

  @Get('qualification/forms/:id') async version(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const result = await this.qualification.getVersion(request.user, id);
    if (!result) throw new NotFoundException('Qualification form version not found');
    return result;
  }

  @Post('qualification/forms') createDraft(@Req() request: AuthenticatedRequest, @Body() form: unknown) {
    return this.qualification.createDraft(request.user, form);
  }

  @Post('qualification/forms/:id/publish') async publish(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const result = await this.qualification.publish(request.user, id);
    if (!result) throw new NotFoundException('Qualification draft not found');
    return result;
  }

  @Post('leads/:leadId/qualification-answers') async submitAnswers(
    @Req() request: AuthenticatedRequest,
    @Param('leadId', ParseUUIDPipe) leadId: string,
    @Body() answers: unknown,
  ) {
    const idempotencyHeader = request.headers['idempotency-key'];
    if (idempotencyHeader !== undefined && typeof idempotencyHeader !== 'string') throw new BadRequestException('Invalid Idempotency-Key header');
    const result = await this.qualification.submitAnswers(request.user, leadId, answers, idempotencyHeader);
    if (!result) throw new NotFoundException('Lead not found');
    return result;
  }
}
