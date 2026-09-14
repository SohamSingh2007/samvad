import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { MeetingsService } from './meetings.service.js';
import { auth } from '../auth/auth.js';
import { fromNodeHeaders } from 'better-auth/node';
import type { AuthenticatedUser } from '../auth/auth.guard.js';

@Controller('api/meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  private async getOptionalSessionUser(req: Request): Promise<AuthenticatedUser | null> {
    try {
      const headers = fromNodeHeaders(req.headers);
      const sessionResult = await auth.api.getSession({ headers });
      if (sessionResult?.user) {
        return sessionResult.user as AuthenticatedUser;
      }
    } catch {
      // Guest or session verification failed
    }
    return null;
  }

  /**
   * Retrieves all meetings for the current authenticated user.
   */
  @Get()
  async getUserMeetings(@Req() req: Request) {
    const sessionUser = await this.getOptionalSessionUser(req);
    if (!sessionUser?.id) {
      return [];
    }
    return this.meetingsService.getUserMeetings(sessionUser.id);
  }

  /**
   * Creates a new meeting room. Anyone (logged in or guest) can create a room.
   */
  @Post()
  async createMeeting(
    @Req() req: Request,
    @Body() body?: { title?: string; guestName?: string; guestId?: string; scheduledAt?: string },
  ) {
    const sessionUser = await this.getOptionalSessionUser(req);
    const user = await this.meetingsService.resolveUserOrGuest(
      sessionUser,
      body?.guestName,
      body?.guestId,
    );
    const scheduledDate = body?.scheduledAt ? new Date(body.scheduledAt) : null;
    const meeting = await this.meetingsService.createMeeting(user, body?.title, scheduledDate);
    return {
      ...meeting,
      currentUser: user,
    };
  }

  /**
   * Retrieves meeting details by roomCode. Publicly accessible.
   */
  @Get(':roomCode')
  async getMeeting(@Param('roomCode') roomCode: string) {
    return this.meetingsService.getMeetingByCode(roomCode);
  }

  /**
   * Joins an active meeting room. Anyone with the code can join.
   */
  @Post(':roomCode/join')
  async joinMeeting(
    @Param('roomCode') roomCode: string,
    @Req() req: Request,
    @Body() body?: { guestName?: string; guestId?: string },
  ) {
    const sessionUser = await this.getOptionalSessionUser(req);
    const user = await this.meetingsService.resolveUserOrGuest(
      sessionUser,
      body?.guestName,
      body?.guestId,
    );
    const result = await this.meetingsService.joinMeeting(roomCode, user);
    return {
      ...result,
      currentUser: user,
    };
  }

  /**
   * Leaves or concludes the meeting room.
   */
  @Post(':roomCode/leave')
  async leaveMeeting(
    @Param('roomCode') roomCode: string,
    @Req() req: Request,
    @Body() body?: { endForAll?: boolean; userId?: string; guestId?: string },
  ) {
    const sessionUser = await this.getOptionalSessionUser(req);
    const userId = sessionUser?.id || body?.userId || body?.guestId || '';
    return this.meetingsService.leaveMeeting(
      roomCode,
      userId,
      Boolean(body?.endForAll),
    );
  }

  /**
   * Returns current active participants in the room for real-time presence synchronization.
   */
  @Get(':roomCode/participants')
  async getParticipants(@Param('roomCode') roomCode: string) {
    return this.meetingsService.getActiveParticipants(roomCode);
  }

  /**
   * Submits user star rating and optional comments for a concluded meeting.
   */
  @Post(':roomCode/feedback')
  async submitFeedback(
    @Param('roomCode') roomCode: string,
    @Req() req: Request,
    @Body() body: { rating: number; comment?: string; userId?: string },
  ) {
    const sessionUser = await this.getOptionalSessionUser(req);
    const userId = sessionUser?.id || body?.userId || '';
    return this.meetingsService.recordFeedback(roomCode, {
      ...body,
      userId,
    });
  }
}
