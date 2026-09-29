import { All, Controller, Req, Res, Inject } from '@nestjs/common';
import type { Request, Response } from 'express';
import { auth } from './auth.js';
import { toNodeHandler } from 'better-auth/node';
import { DB_CONNECTION } from '../db/db.module.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';

@Controller('api/auth')
export class AuthController {
  constructor(@Inject(DB_CONNECTION) private readonly db: any) {}

  @All('{*path}')
  async handler(@Req() req: Request, @Res() res: Response) {
    // Intercept login attempts for deleted accounts
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : null;
    if (email && (req.url.includes('/sign-in') || req.url.includes('/login'))) {
      try {
        const existing = await this.db
          .select()
          .from(schema.user)
          .where(eq(schema.user.email, email))
          .limit(1);

        if (existing && existing.length > 0) {
          const u = existing[0];
          const isDeleted =
            typeof u.accessibilityPreferences === 'object' &&
            Boolean(u.accessibilityPreferences?.deleted);

          if (isDeleted) {
            return res.status(400).json({
              error: {
                message: 'User not exist',
                code: 'USER_NOT_FOUND',
              },
              message: 'User not exist',
            });
          }
        }
      } catch (err) {
        console.error('Error checking user deletion status:', err);
      }
    }

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
