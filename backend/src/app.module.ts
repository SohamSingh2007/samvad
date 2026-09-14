import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DbModule } from './db/db.module.js';
import { AuthModule } from './auth/auth.module.js';
import { MeetingsModule } from './meetings/meetings.module.js';

@Module({
  imports: [ConfigModule.forRoot(), DbModule, AuthModule, MeetingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
