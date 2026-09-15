import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, isNull, desc, or } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../db/db.module.js';
import * as schema from '../db/schema.js';
import type { AuthenticatedUser } from '../auth/auth.guard.js';
import crypto from 'crypto';

function generateRandomSlug(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export function generateRoomCode(): string {
  return `${generateRandomSlug(3)}-${generateRandomSlug(4)}-${generateRandomSlug(3)}`;
}

export interface UserIdentity {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface ParticipantInfo {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
  joinedAt: Date;
}

@Injectable()
export class MeetingsService {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Resolves an authenticated user or creates a guest identity in the database.
   */
  async resolveUserOrGuest(
    user?: AuthenticatedUser | null,
    guestName?: string,
    guestId?: string,
  ): Promise<UserIdentity> {
    if (user?.id) {
      return {
        id: user.id,
        name: user.name || "Anonymous User",
        email: user.email || `${user.id}@samvad.user`,
        image: user.image || null,
      };
    }

    // Check if an existing guest ID was provided
    if (guestId) {
      const [existingGuest] = await this.db
        .select()
        .from(schema.user)
        .where(eq(schema.user.id, guestId))
        .limit(1);

      if (existingGuest) {
        if (guestName && guestName.trim() && existingGuest.name !== guestName.trim()) {
          await this.db
            .update(schema.user)
            .set({ name: guestName.trim(), updatedAt: new Date() })
            .where(eq(schema.user.id, existingGuest.id));
          return {
            id: existingGuest.id,
            name: guestName.trim(),
            email: existingGuest.email,
            image: existingGuest.image || null,
          };
        }
        return {
          id: existingGuest.id,
          name: existingGuest.name,
          email: existingGuest.email,
          image: existingGuest.image || null,
        };
      }
    }

    // Create new guest user record in user table to maintain foreign key integrity
    const id = `guest_${crypto.randomBytes(8).toString("hex")}`;
    const name = guestName?.trim() || "Guest";
    const email = `${id}@guest.samvad.internal`;
    const now = new Date();

    const [newGuest] = await this.db
      .insert(schema.user)
      .values({
        id,
        name,
        email,
        emailVerified: false,
        image: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return {
      id: newGuest.id,
      name: newGuest.name,
      email: newGuest.email,
      image: null,
    };
  }

  /**
   * Generates a unique room code and creates an active or scheduled meeting record.
   */
  async createMeeting(
    hostUser: UserIdentity,
    title?: string,
    scheduledAt?: Date | null,
    accessPolicy: 'open' | 'approval' = 'open',
  ) {
    let roomCode = generateRoomCode();
    let attempts = 0;

    // Ensure room code uniqueness
    while (attempts < 5) {
      const existing = await this.db
        .select()
        .from(schema.meetings)
        .where(eq(schema.meetings.roomCode, roomCode))
        .limit(1);

      if (existing.length === 0) break;
      roomCode = generateRoomCode();
      attempts++;
    }

    const meetingId = crypto.randomUUID();
    const meetingTitle = title?.trim() || `${hostUser.name}'s Meeting`;
    const isScheduled = Boolean(scheduledAt && scheduledAt.getTime() > Date.now());
    const meetingStatus = isScheduled ? 'scheduled' : 'active';
    const policy = accessPolicy === 'approval' ? 'approval' : 'open';

    const [newMeeting] = await this.db
      .insert(schema.meetings)
      .values({
        id: meetingId,
        hostId: hostUser.id,
        title: meetingTitle,
        status: meetingStatus,
        accessPolicy: policy,
        scheduledAt: scheduledAt || null,
        roomCode,
        createdAt: new Date(),
      })
      .returning();

    // If starting immediately (active), register host as the initial participant
    if (meetingStatus === 'active') {
      await this.db
        .insert(schema.meetingParticipants)
        .values({
          meetingId,
          userId: hostUser.id,
          role: 'host',
          status: 'active',
          joinedAt: new Date(),
          leftAt: null,
        })
        .onConflictDoNothing();
    }

    return {
      id: newMeeting.id,
      roomCode: newMeeting.roomCode,
      title: newMeeting.title,
      status: newMeeting.status,
      accessPolicy: newMeeting.accessPolicy,
      scheduledAt: newMeeting.scheduledAt,
      hostId: newMeeting.hostId,
      createdAt: newMeeting.createdAt,
    };
  }

  /**
   * Retrieves all meetings created by or participated in by a specific user.
   */
  async getUserMeetings(userId: string) {
    const list = await this.db
      .select({
        id: schema.meetings.id,
        roomCode: schema.meetings.roomCode,
        title: schema.meetings.title,
        status: schema.meetings.status,
        accessPolicy: schema.meetings.accessPolicy,
        scheduledAt: schema.meetings.scheduledAt,
        createdAt: schema.meetings.createdAt,
        hostId: schema.meetings.hostId,
      })
      .from(schema.meetings)
      .where(eq(schema.meetings.hostId, userId))
      .orderBy(desc(schema.meetings.createdAt))
      .limit(50);

    return list;
  }

  /**
   * Retrieves meeting details by roomCode.
   */
  async getMeetingByCode(roomCode: string) {
    const cleanCode = roomCode.trim().toLowerCase();

    const [meetingRecord] = await this.db
      .select({
        id: schema.meetings.id,
        title: schema.meetings.title,
        status: schema.meetings.status,
        accessPolicy: schema.meetings.accessPolicy,
        roomCode: schema.meetings.roomCode,
        scheduledAt: schema.meetings.scheduledAt,
        createdAt: schema.meetings.createdAt,
        hostId: schema.meetings.hostId,
        hostName: schema.user.name,
        hostEmail: schema.user.email,
        hostImage: schema.user.image,
      })
      .from(schema.meetings)
      .leftJoin(schema.user, eq(schema.meetings.hostId, schema.user.id))
      .where(eq(schema.meetings.roomCode, cleanCode))
      .limit(1);

    if (!meetingRecord) {
      throw new NotFoundException(`Meeting with code "${cleanCode}" not found`);
    }

    return meetingRecord;
  }

  /**
   * Registers a user (authenticated or guest) as joined to the meeting room.
   */
  async joinMeeting(roomCode: string, user: UserIdentity) {
    const meeting = await this.getMeetingByCode(roomCode);

    if (meeting.status === 'ended') {
      throw new BadRequestException('This meeting has already ended by the host');
    }

    const isHost = meeting.hostId === user.id;
    const participantRole = isHost ? 'host' : 'attendee';

    // Check if participant already exists in the meeting
    const [existing] = await this.db
      .select()
      .from(schema.meetingParticipants)
      .where(
        and(
          eq(schema.meetingParticipants.meetingId, meeting.id),
          eq(schema.meetingParticipants.userId, user.id),
        ),
      )
      .limit(1);

    // Host always joins directly as active host
    if (isHost) {
      if (existing) {
        await this.db
          .update(schema.meetingParticipants)
          .set({
            leftAt: null,
            joinedAt: new Date(),
            role: 'host',
            status: 'active',
          })
          .where(
            and(
              eq(schema.meetingParticipants.meetingId, meeting.id),
              eq(schema.meetingParticipants.userId, user.id),
            ),
          );
      } else {
        await this.db.insert(schema.meetingParticipants).values({
          meetingId: meeting.id,
          userId: user.id,
          role: 'host',
          status: 'active',
          joinedAt: new Date(),
          leftAt: null,
        });
      }

      const participants = await this.getActiveParticipants(roomCode);
      return {
        meeting,
        participants,
        status: 'active',
      };
    }

    // Non-host joining an approval-gated room
    if (meeting.accessPolicy === 'approval') {
      // If previously admitted, let them enter
      if (existing?.status === 'active') {
        await this.db
          .update(schema.meetingParticipants)
          .set({
            leftAt: null,
            joinedAt: new Date(),
          })
          .where(
            and(
              eq(schema.meetingParticipants.meetingId, meeting.id),
              eq(schema.meetingParticipants.userId, user.id),
            ),
          );
        const participants = await this.getActiveParticipants(roomCode);
        return {
          meeting,
          participants,
          status: 'active',
        };
      }

      if (existing?.status === 'rejected') {
        return {
          meeting,
          participants: [],
          status: 'rejected',
          message: 'The host declined your request to join this meeting.',
        };
      }

      // Record as waiting in lobby
      if (existing) {
        await this.db
          .update(schema.meetingParticipants)
          .set({
            leftAt: null,
            joinedAt: new Date(),
            status: 'waiting',
          })
          .where(
            and(
              eq(schema.meetingParticipants.meetingId, meeting.id),
              eq(schema.meetingParticipants.userId, user.id),
            ),
          );
      } else {
        await this.db.insert(schema.meetingParticipants).values({
          meetingId: meeting.id,
          userId: user.id,
          role: 'attendee',
          status: 'waiting',
          joinedAt: new Date(),
          leftAt: null,
        });
      }

      return {
        meeting,
        participants: [],
        status: 'waiting',
        message: 'Waiting for host approval to enter the room.',
      };
    }

    // Open room: anyone joins directly
    if (existing) {
      await this.db
        .update(schema.meetingParticipants)
        .set({
          leftAt: null,
          joinedAt: new Date(),
          role: participantRole,
          status: 'active',
        })
        .where(
          and(
            eq(schema.meetingParticipants.meetingId, meeting.id),
            eq(schema.meetingParticipants.userId, user.id),
          ),
        );
    } else {
      await this.db.insert(schema.meetingParticipants).values({
        meetingId: meeting.id,
        userId: user.id,
        role: participantRole,
        status: 'active',
        joinedAt: new Date(),
        leftAt: null,
      });
    }

    const participants = await this.getActiveParticipants(roomCode);

    return {
      meeting,
      participants,
      status: 'active',
    };
  }

  /**
   * Handles leaving a room or ending it for all attendees.
   */
  async leaveMeeting(
    roomCode: string,
    userOrId: UserIdentity | AuthenticatedUser | string,
    endForAll = false,
  ) {
    const userId = typeof userOrId === 'string' ? userOrId : userOrId?.id;
    if (!userId) {
      return {
        status: 'left',
        message: 'You have left the meeting',
      };
    }

    const meeting = await this.getMeetingByCode(roomCode);

    let isHost = meeting.hostId === userId;
    if (!isHost) {
      const [participant] = await this.db
        .select({ role: schema.meetingParticipants.role })
        .from(schema.meetingParticipants)
        .where(
          and(
            eq(schema.meetingParticipants.meetingId, meeting.id),
            eq(schema.meetingParticipants.userId, userId),
          ),
        )
        .limit(1);
      if (participant?.role === 'host') {
        isHost = true;
      }
    }

    if (endForAll && isHost) {
      // Host concluded the meeting for everyone
      await this.db
        .update(schema.meetings)
        .set({ status: 'ended' })
        .where(eq(schema.meetings.id, meeting.id));

      await this.db
        .update(schema.meetingParticipants)
        .set({ leftAt: new Date() })
        .where(
          and(
            eq(schema.meetingParticipants.meetingId, meeting.id),
            isNull(schema.meetingParticipants.leftAt),
          ),
        );

      return {
        status: 'ended',
        message: 'Meeting has been concluded for all participants',
      };
    }

    // Mark single user as left
    await this.db
      .update(schema.meetingParticipants)
      .set({ leftAt: new Date() })
      .where(
        and(
          eq(schema.meetingParticipants.meetingId, meeting.id),
          eq(schema.meetingParticipants.userId, userId),
        ),
      );

    return {
      status: 'left',
      message: 'You have left the meeting',
    };
  }

  /**
   * Returns all active participants currently in the room.
   */
  async getActiveParticipants(roomCode: string): Promise<ParticipantInfo[]> {
    const cleanCode = roomCode.trim().toLowerCase();

    const [meeting] = await this.db
      .select({ id: schema.meetings.id, status: schema.meetings.status })
      .from(schema.meetings)
      .where(eq(schema.meetings.roomCode, cleanCode))
      .limit(1);

    if (!meeting) {
      throw new NotFoundException(`Meeting with code "${cleanCode}" not found`);
    }

    if (meeting.status === 'ended') {
      throw new BadRequestException('This meeting has ended');
    }

    const records = await this.db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
        image: schema.user.image,
        role: schema.meetingParticipants.role,
        joinedAt: schema.meetingParticipants.joinedAt,
      })
      .from(schema.meetingParticipants)
      .innerJoin(schema.user, eq(schema.meetingParticipants.userId, schema.user.id))
      .where(
        and(
          eq(schema.meetingParticipants.meetingId, meeting.id),
          isNull(schema.meetingParticipants.leftAt),
          eq(schema.meetingParticipants.status, 'active'),
        ),
      )
      .orderBy(schema.meetingParticipants.joinedAt);

    return records;
  }

  /**
   * Retrieves current join/admission status of a specific participant.
   */
  async getParticipantStatus(roomCode: string, userId: string) {
    const meeting = await this.getMeetingByCode(roomCode);
    if (meeting.status === 'ended') {
      return { status: 'ended' };
    }

    if (meeting.hostId === userId) {
      return { status: 'active', isHost: true };
    }

    const [participant] = await this.db
      .select({
        status: schema.meetingParticipants.status,
        role: schema.meetingParticipants.role,
        leftAt: schema.meetingParticipants.leftAt,
      })
      .from(schema.meetingParticipants)
      .where(
        and(
          eq(schema.meetingParticipants.meetingId, meeting.id),
          eq(schema.meetingParticipants.userId, userId),
        ),
      )
      .orderBy(desc(schema.meetingParticipants.joinedAt))
      .limit(1);

    if (!participant) {
      return { status: 'not_joined' };
    }

    if (participant.status === 'rejected') {
      return { status: 'rejected', role: participant.role, isHost: false };
    }

    if (participant.leftAt) {
      return { status: 'left', role: participant.role, isHost: false };
    }

    return {
      status: participant.status || 'active',
      role: participant.role,
      isHost: participant.role === 'host',
    };
  }

  /**
   * Returns list of participants currently in the waiting room. Host-only.
   */
  async getWaitingParticipants(roomCode: string, hostUserId: string) {
    const meeting = await this.getMeetingByCode(roomCode);
    await this.assertHost(meeting.id, meeting.hostId, hostUserId);

    const waiting = await this.db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
        image: schema.user.image,
        role: schema.meetingParticipants.role,
        joinedAt: schema.meetingParticipants.joinedAt,
      })
      .from(schema.meetingParticipants)
      .innerJoin(schema.user, eq(schema.meetingParticipants.userId, schema.user.id))
      .where(
        and(
          eq(schema.meetingParticipants.meetingId, meeting.id),
          isNull(schema.meetingParticipants.leftAt),
          eq(schema.meetingParticipants.status, 'waiting'),
        ),
      )
      .orderBy(schema.meetingParticipants.joinedAt);

    return waiting;
  }

  /**
   * Admits one or all waiting participants into the active meeting. Host-only.
   */
  async admitParticipant(
    roomCode: string,
    hostUserId: string,
    targetUserId?: string,
    admitAll = false,
  ) {
    const meeting = await this.getMeetingByCode(roomCode);
    await this.assertHost(meeting.id, meeting.hostId, hostUserId);

    if (admitAll) {
      await this.db
        .update(schema.meetingParticipants)
        .set({ status: 'active', joinedAt: new Date() })
        .where(
          and(
            eq(schema.meetingParticipants.meetingId, meeting.id),
            eq(schema.meetingParticipants.status, 'waiting'),
          ),
        );
      return { success: true, message: 'All waiting participants admitted' };
    }

    if (!targetUserId) {
      throw new BadRequestException('targetUserId is required when not admitting all');
    }

    await this.db
      .update(schema.meetingParticipants)
      .set({ status: 'active', joinedAt: new Date() })
      .where(
        and(
          eq(schema.meetingParticipants.meetingId, meeting.id),
          eq(schema.meetingParticipants.userId, targetUserId),
        ),
      );

    return { success: true, message: 'Participant admitted' };
  }

  /**
   * Denies / rejects a waiting participant from entering the meeting. Host-only.
   */
  async denyParticipant(roomCode: string, hostUserId: string, targetUserId: string) {
    const meeting = await this.getMeetingByCode(roomCode);
    await this.assertHost(meeting.id, meeting.hostId, hostUserId);

    if (!targetUserId) {
      throw new BadRequestException('targetUserId is required');
    }

    await this.db
      .update(schema.meetingParticipants)
      .set({ status: 'rejected', leftAt: new Date() })
      .where(
        and(
          eq(schema.meetingParticipants.meetingId, meeting.id),
          eq(schema.meetingParticipants.userId, targetUserId),
        ),
      );

    return { success: true, message: 'Participant denied' };
  }

  /**
   * Changes the meeting's access policy live ('open' | 'approval'). Host-only.
   */
  async updateMeetingAccessPolicy(
    roomCode: string,
    hostUserId: string,
    accessPolicy: 'open' | 'approval',
  ) {
    const meeting = await this.getMeetingByCode(roomCode);
    await this.assertHost(meeting.id, meeting.hostId, hostUserId);

    const policy = accessPolicy === 'approval' ? 'approval' : 'open';

    await this.db
      .update(schema.meetings)
      .set({ accessPolicy: policy })
      .where(eq(schema.meetings.id, meeting.id));

    // If opening up the meeting, immediately admit any waiting participants!
    if (policy === 'open') {
      await this.db
        .update(schema.meetingParticipants)
        .set({ status: 'active', joinedAt: new Date() })
        .where(
          and(
            eq(schema.meetingParticipants.meetingId, meeting.id),
            eq(schema.meetingParticipants.status, 'waiting'),
          ),
        );
    }

    return { success: true, accessPolicy: policy };
  }

  /**
   * Asserts that a given user is the host of the meeting.
   */
  private async assertHost(meetingId: string, meetingHostId: string, userId: string) {
    if (meetingHostId === userId) return;

    const [participant] = await this.db
      .select({ role: schema.meetingParticipants.role })
      .from(schema.meetingParticipants)
      .where(
        and(
          eq(schema.meetingParticipants.meetingId, meetingId),
          eq(schema.meetingParticipants.userId, userId),
        ),
      )
      .limit(1);

    if (participant?.role !== 'host') {
      throw new ForbiddenException('Only the host has permission to perform this action');
    }
  }

  /**
   * Records user feedback (stars rating & optional comment) for a meeting.
   */
  async recordFeedback(
    roomCode: string,
    feedback: { rating: number; comment?: string; userId?: string },
  ) {
    const meeting = await this.getMeetingByCode(roomCode);
    console.log(
      `[Meeting Feedback] Room: ${meeting.roomCode} (${meeting.id}) | Rating: ${feedback.rating} stars | Comment: "${feedback.comment || ''}" | User: ${feedback.userId || 'guest'}`,
    );

    return {
      success: true,
      message: 'Feedback submitted successfully',
      roomCode: meeting.roomCode,
    };
  }
}
