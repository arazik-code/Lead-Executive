import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../database/database.module';

@Controller()
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get('health/live') live() { return { status: 'ok' }; }

  @Get('health/ready')
  async ready() {
    try {
      await this.database.query('SELECT 1');
      return { status: 'ok', database: 'ok' };
    } catch {
      throw new ServiceUnavailableException({ status: 'unavailable', database: 'unavailable' });
    }
  }
}
