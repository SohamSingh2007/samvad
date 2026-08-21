import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient<any, 'public', any>;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (supabaseUrl && supabaseKey) {
      this.client = createClient<any, 'public', any>(supabaseUrl, supabaseKey);
    } else {
      this.logger.warn(
        'Supabase URL or Key is missing. Supabase client is not initialized.',
      );
    }
  }

  getClient(): SupabaseClient<any, 'public', any> {
    return this.client;
  }

  async checkConnection(): Promise<boolean> {
    if (!this.client) return false;

    try {
      // Just check if we can reach the auth API
      const { error } = await this.client.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });
      if (error && error.message !== 'Invalid login credentials') {
        // Log the error but connection might still be fine (e.g. if permissions change)
        this.logger.debug(
          `Supabase auth check returned error: ${error.message}`,
        );
      }
      return true; // if it didn't throw a network error, we assume connected
    } catch (err) {
      this.logger.error('Database connection failed', err);
      return false;
    }
  }
}
