import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  Query,
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

  private async resolveCallerUserId(req: Request, fallbackId?: string): Promise<string> {
    const sessionUser = await this.getOptionalSessionUser(req);
    if (sessionUser?.id) return sessionUser.id;
    if (fallbackId && typeof fallbackId === 'string' && fallbackId.trim()) return fallbackId.trim();
    const headerGuestId = req.headers['x-guest-id'];
    if (typeof headerGuestId === 'string' && headerGuestId.trim()) return headerGuestId.trim();
    return '';
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
    @Body() body?: {
      title?: string;
      guestName?: string;
      guestId?: string;
      scheduledAt?: string;
      accessPolicy?: 'open' | 'approval';
    },
  ) {
    const sessionUser = await this.getOptionalSessionUser(req);
    const user = await this.meetingsService.resolveUserOrGuest(
      sessionUser,
      body?.guestName,
      body?.guestId,
    );
    const scheduledDate = body?.scheduledAt ? new Date(body.scheduledAt) : null;
    const meeting = await this.meetingsService.createMeeting(
      user,
      body?.title,
      scheduledDate,
      body?.accessPolicy || 'open',
    );
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
   * Checks the join/admission status of the current user.
   */
  @Get(':roomCode/my-status')
  async getMyStatus(
    @Param('roomCode') roomCode: string,
    @Req() req: Request,
    @Query('userId') queryUserId?: string,
  ) {
    const userId = await this.resolveCallerUserId(req, queryUserId);
    return this.meetingsService.getParticipantStatus(roomCode, userId);
  }

  /**
   * Retrieves all participants waiting in the lobby for host approval. Host-only.
   */
  @Get(':roomCode/waiting')
  async getWaitingParticipants(
    @Param('roomCode') roomCode: string,
    @Req() req: Request,
    @Query('hostId') queryHostId?: string,
  ) {
    const hostUserId = await this.resolveCallerUserId(req, queryHostId);
    return this.meetingsService.getWaitingParticipants(roomCode, hostUserId);
  }

  /**
   * Admits one or all waiting participants into the meeting. Host-only.
   */
  @Post(':roomCode/admit')
  async admitParticipant(
    @Param('roomCode') roomCode: string,
    @Req() req: Request,
    @Body() body: { targetUserId?: string; admitAll?: boolean; hostId?: string },
  ) {
    const hostUserId = await this.resolveCallerUserId(req, body?.hostId);
    return this.meetingsService.admitParticipant(
      roomCode,
      hostUserId,
      body?.targetUserId,
      Boolean(body?.admitAll),
    );
  }

  /**
   * Denies a waiting participant from entering the meeting. Host-only.
   */
  @Post(':roomCode/deny')
  async denyParticipant(
    @Param('roomCode') roomCode: string,
    @Req() req: Request,
    @Body() body: { targetUserId: string; hostId?: string },
  ) {
    const hostUserId = await this.resolveCallerUserId(req, body?.hostId);
    return this.meetingsService.denyParticipant(roomCode, hostUserId, body.targetUserId);
  }

  /**
   * Updates the meeting's access policy live ('open' | 'approval'). Host-only.
   */
  @Patch(':roomCode/access-policy')
  async updateAccessPolicy(
    @Param('roomCode') roomCode: string,
    @Req() req: Request,
    @Body() body: { accessPolicy: 'open' | 'approval'; hostId?: string },
  ) {
    const hostUserId = await this.resolveCallerUserId(req, body?.hostId);
    return this.meetingsService.updateMeetingAccessPolicy(
      roomCode,
      hostUserId,
      body.accessPolicy,
    );
  }

  @Post(':roomCode/access-policy')
  async updateAccessPolicyPost(
    @Param('roomCode') roomCode: string,
    @Req() req: Request,
    @Body() body: { accessPolicy: 'open' | 'approval'; hostId?: string },
  ) {
    const hostUserId = await this.resolveCallerUserId(req, body?.hostId);
    return this.meetingsService.updateMeetingAccessPolicy(
      roomCode,
      hostUserId,
      body.accessPolicy,
    );
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
