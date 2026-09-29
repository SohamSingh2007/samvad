import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { AdminController } from './admin.controller.js';

@Module({
  imports: [DbModule],
  controllers: [AdminController],
})
export class AdminModule {}
