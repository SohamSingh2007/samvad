import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { auth } from './auth.js';
import { fromNodeHeaders } from 'better-auth/node';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  session?: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
}

@Injectable()
export class SessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    try {
      const headers = fromNodeHeaders(request.headers);
      const sessionResult = await auth.api.getSession({
        headers,
      });

      if (!sessionResult || !sessionResult.user || !sessionResult.session) {
        throw new UnauthorizedException('Active authentication session required');
      }

      request.user = sessionResult.user as AuthenticatedUser;
      request.session = sessionResult.session as any;
      return true;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Failed to verify session credentials');
    }
  }
}
