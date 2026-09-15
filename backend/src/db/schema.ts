import { pgTable, text, timestamp, boolean, json, varchar } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('emailVerified').notNull(),
	image: text('image'),
	createdAt: timestamp('createdAt').notNull(),
	updatedAt: timestamp('updatedAt').notNull(),
	accessibilityPreferences: json('accessibilityPreferences'),
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expiresAt').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('createdAt').notNull(),
	updatedAt: timestamp('updatedAt').notNull(),
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	userId: text('userId').notNull().references(() => user.id),
});

export const account = pgTable('account', {
	id: text('id').primaryKey(),
	accountId: text('accountId').notNull(),
	providerId: text('providerId').notNull(),
	userId: text('userId').notNull().references(() => user.id),
	accessToken: text('accessToken'),
	refreshToken: text('refreshToken'),
	idToken: text('idToken'),
	accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
	refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('createdAt').notNull(),
	updatedAt: timestamp('updatedAt').notNull(),
});

export const verification = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expiresAt').notNull(),
	createdAt: timestamp('createdAt'),
	updatedAt: timestamp('updatedAt'),
});

export const meetings = pgTable('meetings', {
	id: text('id').primaryKey(),
	hostId: text('hostId').notNull().references(() => user.id),
	title: text('title').notNull(),
	scheduledAt: timestamp('scheduledAt'),
	status: varchar('status', { length: 50 }).notNull().default('scheduled'),
	accessPolicy: varchar('accessPolicy', { length: 50 }).notNull().default('open'),
	roomCode: varchar('roomCode', { length: 50 }).notNull().unique(),
	createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export const meetingParticipants = pgTable('meeting_participants', {
	meetingId: text('meetingId').notNull().references(() => meetings.id),
	userId: text('userId').notNull().references(() => user.id),
	joinedAt: timestamp('joinedAt').notNull().defaultNow(),
	leftAt: timestamp('leftAt'),
	role: varchar('role', { length: 50 }).notNull().default('attendee'),
	status: varchar('status', { length: 50 }).notNull().default('active'),
});

export const transcripts = pgTable('transcripts', {
	id: text('id').primaryKey(),
	meetingId: text('meetingId').notNull().references(() => meetings.id),
	participantId: text('participantId').notNull().references(() => user.id),
	source: varchar('source', { length: 50 }).notNull(),
	text: text('text').notNull(),
	timestamp: timestamp('timestamp').notNull().defaultNow(),
});
