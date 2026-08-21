import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('api/health')
export class HealthController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get()
  async checkHealth() {
    const isDbConnected = await this.supabaseService.checkConnection();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: isDbConnected ? 'connected' : 'error',
    };
  }
}
