import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { MeetingsController } from './meetings.controller.js';
import { MeetingsService } from './meetings.service.js';
import { SignalingGateway } from './signaling.gateway.js';

@Module({
  imports: [DbModule, AuthModule],
  controllers: [MeetingsController],
  providers: [MeetingsService, SignalingGateway],
  exports: [MeetingsService],
})
export class MeetingsModule {}

