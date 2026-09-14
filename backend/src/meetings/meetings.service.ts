import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
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

    const [newMeeting] = await this.db
      .insert(schema.meetings)
      .values({
        id: meetingId,
        hostId: hostUser.id,
        title: meetingTitle,
        status: meetingStatus,
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
    const existing = await this.db
      .select()
      .from(schema.meetingParticipants)
      .where(
        and(
          eq(schema.meetingParticipants.meetingId, meeting.id),
          eq(schema.meetingParticipants.userId, user.id),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      // Re-activate active presence
      await this.db
        .update(schema.meetingParticipants)
        .set({
          leftAt: null,
          joinedAt: new Date(),
          role: participantRole,
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
        joinedAt: new Date(),
        leftAt: null,
      });
    }

    const participants = await this.getActiveParticipants(roomCode);

    return {
      meeting,
      participants,
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
        ),
      )
      .orderBy(schema.meetingParticipants.joinedAt);

    return records;
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
