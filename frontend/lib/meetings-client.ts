"use client";

export interface MeetingDetails {
  id: string;
  title: string;
  status: "active" | "ended" | "scheduled";
  roomCode: string;
  createdAt: string;
  scheduledAt?: string | null;
  hostId: string;
  hostName?: string | null;
  hostEmail?: string | null;
  hostImage?: string | null;
}

export interface ParticipantInfo {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: "host" | "attendee" | string;
  joinedAt: string;
}

export function getSavedGuestIdentity(): { id: string | null; name: string | null } {
  if (typeof window === "undefined") return { id: null, name: null };
  try {
    return {
      id: localStorage.getItem("samvad_guest_id"),
      name: localStorage.getItem("samvad_guest_name"),
    };
  } catch {
    return { id: null, name: null };
  }
}

export function saveGuestIdentity(id: string, name: string) {
  if (typeof window === "undefined") return;
  try {
    if (id) localStorage.setItem("samvad_guest_id", id);
    if (name) localStorage.setItem("samvad_guest_name", name);
  } catch {}
}

/**
 * Resilient HTTP fetch that first uses the same-origin Next.js App Router proxy,
 * and automatically falls back to the direct backend endpoint if needed.
 */
async function fetchMeetingApi(urlPath: string, options: RequestInit): Promise<Response> {
  const cleanPath = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;

  // 1. Primary: Same-origin Next.js proxy route (avoids Safari cross-origin & mixed-content blocks)
  try {
    const res = await fetch(cleanPath, options);
    if (res.status !== 502 && res.status !== 504) {
      return res;
    }
  } catch (err: any) {
    console.warn(`Same-origin route ${cleanPath} failed, attempting direct backend connection:`, err?.message || err);
  }

  // 2. Fallback: Direct connection to backend
  let directBase = "http://localhost:4000";
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("qixolabs.com")) {
      directBase = "https://samvad-api.qixolabs.com";
    } else if (host === "localhost" || host === "127.0.0.1") {
      directBase = "http://localhost:4000";
    } else {
      directBase = `${window.location.protocol}//${host}:4000`;
    }
  }

  try {
    return await fetch(`${directBase}${cleanPath}`, options);
  } catch (fallbackErr: any) {
    const rawMsg = fallbackErr?.message || "";
    if (
      rawMsg.toLowerCase().includes("load failed") ||
      rawMsg.toLowerCase().includes("failed to fetch")
    ) {
      throw new Error("Unable to reach the meeting server. Please check your network connection.");
    }
    throw fallbackErr;
  }
}

/**
 * Creates an active or scheduled meeting room and registers the host.
 */
export async function createMeeting(options?: {
  title?: string;
  guestName?: string;
  scheduledAt?: string;
} | string): Promise<{
  id: string;
  roomCode: string;
  title: string;
  status: string;
  scheduledAt?: string | null;
  hostId: string;
  currentUser?: { id: string; name: string; email: string; image?: string | null };
}> {
  const title = typeof options === "string" ? options : options?.title;
  const scheduledAt = typeof options === "object" ? options?.scheduledAt : undefined;
  let guestName = typeof options === "object" ? options?.guestName : undefined;
  const saved = getSavedGuestIdentity();
  if (!guestName && saved.name) {
    guestName = saved.name;
  }

  const response = await fetchMeetingApi("/api/meetings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      title,
      guestName,
      scheduledAt,
      guestId: saved.id || undefined,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create meeting room.");
  }

  const data = await response.json();
  if (data.currentUser?.id && data.currentUser.id.startsWith("guest_")) {
    saveGuestIdentity(data.currentUser.id, data.currentUser.name);
  }
  return data;
}

/**
 * Retrieves meetings associated with the current user.
 */
export async function getUserMeetings(): Promise<MeetingDetails[]> {
  try {
    const response = await fetchMeetingApi("/api/meetings", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch {
    return [];
  }
}

/**
 * Convenience method to schedule an upcoming meeting.
 */
export async function scheduleMeeting(
  title: string,
  scheduledAt: string,
): Promise<any> {
  return createMeeting({
    title,
    scheduledAt,
  });
}

/**
 * Retrieves meeting room details by room code.
 */
export async function getMeeting(roomCode: string): Promise<MeetingDetails> {
  const cleanCode = roomCode.trim().toLowerCase();

  const response = await fetchMeetingApi(`/api/meetings/${cleanCode}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err: any = new Error(errorData.message || `Meeting "${cleanCode}" not found.`);
    err.statusCode = response.status;
    throw err;
  }

  return response.json();
}

/**
 * Joins an active meeting room as a participant (logged-in or guest).
 */
export async function joinMeeting(
  roomCode: string,
  guestName?: string,
): Promise<{
  meeting: MeetingDetails;
  participants: ParticipantInfo[];
  currentUser?: { id: string; name: string; email: string; image?: string | null };
}> {
  const cleanCode = roomCode.trim().toLowerCase();
  const saved = getSavedGuestIdentity();
  const effectiveGuestName = guestName?.trim() || saved.name || undefined;

  const response = await fetchMeetingApi(`/api/meetings/${cleanCode}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      guestName: effectiveGuestName,
      guestId: saved.id || undefined,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err: any = new Error(
      errorData.message || `Unable to join meeting room "${cleanCode}".`,
    );
    err.statusCode = response.status;
    throw err;
  }

  const data = await response.json();
  if (data.currentUser?.id && data.currentUser.id.startsWith("guest_")) {
    saveGuestIdentity(data.currentUser.id, data.currentUser.name);
  }
  return data;
}

/**
 * Leaves or concludes the meeting room.
 */
export async function leaveMeeting(
  roomCode: string,
  endForAll = false,
  userId?: string,
): Promise<{ status: string; message: string }> {
  const cleanCode = roomCode.trim().toLowerCase();
  const saved = getSavedGuestIdentity();
  const effectiveUserId = userId || saved.id || undefined;

  const response = await fetchMeetingApi(`/api/meetings/${cleanCode}/leave`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      endForAll,
      userId: effectiveUserId,
      guestId: saved.id || undefined,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to leave meeting room.");
  }

  return response.json();
}

/**
 * Retrieves the current active participants in a meeting room for real-time presence synchronization.
 */
export async function getActiveParticipants(
  roomCode: string,
): Promise<ParticipantInfo[]> {
  const cleanCode = roomCode.trim().toLowerCase();

  const response = await fetchMeetingApi(`/api/meetings/${cleanCode}/participants`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch participants.");
  }

  return response.json();
}

/**
 * Submits user rating and optional comments for a concluded meeting.
 */
export async function submitMeetingFeedback(
  roomCode: string,
  data: { rating: number; comment?: string; userId?: string }
): Promise<{ success: boolean; message: string }> {
  const cleanCode = roomCode.trim().toLowerCase();

  const response = await fetchMeetingApi(`/api/meetings/${cleanCode}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to submit feedback.");
  }

  return response.json();
}
