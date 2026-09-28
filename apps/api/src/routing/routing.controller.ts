import { BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../identity/auth.guard';
import { RoutingService } from './routing.service';

@Controller()
@UseGuards(AuthGuard)
export class RoutingController {
  constructor(private readonly routing: RoutingService) {}

  @Get('routing/rules/active') activeRules() { return this.routing.activeRuleSet(); }

  @Get('routing/agents') agents(@Req() request: AuthenticatedRequest) { return this.routing.agents(request.user); }

  @Get('routing/rules') versions(@Req() request: AuthenticatedRequest) { return this.routing.versions(request.user); }

  @Get('routing/rules/:id') async version(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const result = await this.routing.getVersion(request.user, id);
    if (!result) throw new NotFoundException('Routing rules version not found');
    return result;
  }

  @Post('routing/rules') createDraft(@Req() request: AuthenticatedRequest, @Body() rules: unknown) {
    return this.routing.createDraft(request.user, rules);
  }

  @Post('routing/rules/:id/activate') async activate(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const result = await this.routing.activate(request.user, id);
    if (!result) throw new NotFoundException('Routing rule draft not found');
    return result;
  }

  @Patch('routing/agents/:userId') async updateAgent(@Req() request: AuthenticatedRequest, @Param('userId', ParseUUIDPipe) userId: string, @Body() profile: unknown) {
    const result = await this.routing.updateAgentProfile(request.user, userId, profile);
    if (!result) throw new NotFoundException('Active organization member not found');
    return result;
  }

  @Get('leads/:id/routing-preview') async preview(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const result = await this.routing.preview(request.user, id);
    if (!result) throw new NotFoundException('Lead not found');
    return result;
  }

  @Post('leads/:id/route') async route(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const result = await this.routing.route(request.user, id);
    if (!result) throw new NotFoundException('Lead not found');
    return result;
  }
}
