import { All, Controller, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { auth } from './auth.js';
import { toNodeHandler } from 'better-auth/node';

@Controller('api/auth')
export class AuthController {
  @All('/*')
  handler(@Req() req: Request, @Res() res: Response) {
    const nodeHandler = toNodeHandler(auth);
    return nodeHandler(req, res);
  }
}
