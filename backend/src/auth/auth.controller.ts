import { All, Controller, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { auth } from './auth.js';
import { toNodeHandler } from 'better-auth/node';

@Controller('api/auth')
export class AuthController {
  @All('{*path}')
  handler(@Req() req: Request, @Res() res: Response) {

    const isLocalhost =
      !req.headers['cf-ray'] &&
      (req.headers.origin?.includes('localhost') ||
        req.headers.host?.includes('localhost') ||
        req.headers.origin?.includes('127.0.0.1'));

    if (isLocalhost) {
      const originalSetHeader = res.setHeader.bind(res);
      res.setHeader = function (name: string, value: any) {
        if (name.toLowerCase() === 'set-cookie') {
          const cleanCookie = (c: string) =>
            c
              .replace(/__Secure-/g, '')
              .replace(/;\s*Domain=\.[^;]+/i, '')
              .replace(/;\s*Secure/i, '');

          if (Array.isArray(value)) {
            value = value.map((c) =>
              typeof c === 'string' ? cleanCookie(c) : c,
            );
          } else if (typeof value === 'string') {
            value = cleanCookie(value);
          }
        }
        return originalSetHeader(name, value);
      };
    }

    const nodeHandler = toNodeHandler(auth);
    return nodeHandler(req, res);
  }
}
