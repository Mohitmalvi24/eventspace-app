/**
 * Mock API Service Layer
 *
 * All reads and mutations go through this file — no direct state access from UI.
 * Simulates network latency (300–1500ms).
 * Each function documents its optimism strategy.
 */

import {
  ATTENDEES_MAP,
  CURRENT_USER_ID,
  EVENTS,
  INVITES,
  WAITLIST_MAP,
  getAttendeesForEvent,
  getUserById,
  getWaitlistForEvent,
} from './mockData';
import { Event, EventDetail, Invite, RSVPStatus, ServiceResult } from '../types';

// ─── Latency Simulation ───────────────────────────────────────────────────────

function delay(min = 300, max = 1500): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Event Queries ────────────────────────────────────────────────────────────

/**
 * Fetch paginated list of events.
 * Strategy: pessimistic (waits for full response before UI update).
 */
export async function fetchEvents(): Promise<ServiceResult<Event[]>> {
  try {
    await delay(400, 900);
    return { data: [...EVENTS], error: null };
  } catch (e: any) {
    return { data: null, error: e.message ?? 'Failed to load events.' };
  }
}

/**
 * Fetch a single event with attendees, waitlist, and current user's RSVP status.
 * Strategy: pessimistic.
 */
export async function fetchEventDetail(eventId: string): Promise<ServiceResult<EventDetail>> {
  try {
    await delay(300, 800);
    const event = EVENTS.find((e) => e.id === eventId);
    if (!event) return { data: null, error: 'Event not found.' };

    const attendees = getAttendeesForEvent(eventId);
    const waitlist = getWaitlistForEvent(eventId);

    const isAttending = attendees.some((a) => a.userId === CURRENT_USER_ID);
    const waitlistPos = waitlist.findIndex((w) => w.userId === CURRENT_USER_ID);

    let currentUserStatus: RSVPStatus = 'none';
    let waitlistPosition: number | undefined;

    if (isAttending) {
      currentUserStatus = 'going';
    } else if (waitlistPos !== -1) {
      currentUserStatus = 'waitlisted';
      waitlistPosition = waitlistPos + 1;
    }

    return {
      data: { ...event, attendees, waitlist, currentUserStatus, waitlistPosition },
      error: null,
    };
  } catch (e: any) {
    return { data: null, error: e.message ?? 'Failed to load event.' };
  }
}

// ─── RSVP Mutations ───────────────────────────────────────────────────────────

/**
 * RSVP current user to an event.
 * - If capacity available → goes straight to Going.
 * - If full → joins waitlist.
 * Strategy: PESSIMISTIC — we wait for confirmation before updating UI,
 * because the user needs to know if they're going or waitlisted.
 */
export async function rsvpEvent(
  eventId: string
): Promise<ServiceResult<{ status: RSVPStatus; waitlistPosition?: number }>> {
  try {
    await delay(500, 1200);

    const event = EVENTS.find((e) => e.id === eventId);
    if (!event) return { data: null, error: 'Event not found.' };

    const attendees = ATTENDEES_MAP.get(eventId) ?? [];
    const waitlist = WAITLIST_MAP.get(eventId) ?? [];

    // Already RSVP'd
    if (attendees.includes(CURRENT_USER_ID)) {
      return { data: { status: 'going' }, error: null };
    }
    if (waitlist.includes(CURRENT_USER_ID)) {
      return {
        data: { status: 'waitlisted', waitlistPosition: waitlist.indexOf(CURRENT_USER_ID) + 1 },
        error: null,
      };
    }

    if (attendees.length < event.capacity) {
      ATTENDEES_MAP.set(eventId, [...attendees, CURRENT_USER_ID]);
      return { data: { status: 'going' }, error: null };
    } else {
      const newWaitlist = [...waitlist, CURRENT_USER_ID];
      WAITLIST_MAP.set(eventId, newWaitlist);
      return {
        data: { status: 'waitlisted', waitlistPosition: newWaitlist.length },
        error: null,
      };
    }
  } catch (e: any) {
    return { data: null, error: e.message ?? 'RSVP failed.' };
  }
}

/**
 * Revoke current user's RSVP.
 * - If user was Going → removed from attendees, first waitlist person auto-promoted.
 * - If user was Waitlisted → removed from waitlist.
 * Strategy: PESSIMISTIC — promotion side-effects need to be confirmed.
 * Returns the userId that was auto-promoted (if any).
 */
export async function revokeRsvp(
  eventId: string
): Promise<ServiceResult<{ promoted?: string }>> {
  try {
    await delay(500, 1000);

    const attendees = ATTENDEES_MAP.get(eventId) ?? [];
    const waitlist = WAITLIST_MAP.get(eventId) ?? [];

    if (attendees.includes(CURRENT_USER_ID)) {
      // Remove from going
      const newAttendees = attendees.filter((id) => id !== CURRENT_USER_ID);

      let promoted: string | undefined;
      if (waitlist.length > 0) {
        // Promote first waitlist person
        promoted = waitlist[0];
        newAttendees.push(promoted);
        WAITLIST_MAP.set(eventId, waitlist.slice(1));
      }
      ATTENDEES_MAP.set(eventId, newAttendees);
      return { data: { promoted }, error: null };
    }

    if (waitlist.includes(CURRENT_USER_ID)) {
      WAITLIST_MAP.set(
        eventId,
        waitlist.filter((id) => id !== CURRENT_USER_ID)
      );
      return { data: {}, error: null };
    }

    return { data: {}, error: null };
  } catch (e: any) {
    return { data: null, error: e.message ?? 'Failed to cancel RSVP.' };
  }
}

// ─── Invite Mutations ─────────────────────────────────────────────────────────

/**
 * Send "Plan Together" invites to a list of attendees.
 * Strategy: OPTIMISTIC — we show success immediately, rollback on error.
 * In this mock we always succeed.
 */
export async function sendPlanTogetherInvites(
  eventId: string,
  toUserIds: string[]
): Promise<ServiceResult<Invite[]>> {
  try {
    await delay(400, 900);

    const event = EVENTS.find((e) => e.id === eventId);
    if (!event) return { data: null, error: 'Event not found.' };

    const sender = getUserById(CURRENT_USER_ID)!;

    const newInvites: Invite[] = toUserIds.map((uid, i) => {
      const inv: Invite = {
        id: `inv_${Date.now()}_${i}`,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventCover: event.coverImage,
        fromUserId: CURRENT_USER_ID,
        fromUserName: sender.name,
        fromUserAvatar: sender.avatar,
        toUserId: uid,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      INVITES.push(inv);
      return inv;
    });

    return { data: newInvites, error: null };
  } catch (e: any) {
    return { data: null, error: e.message ?? 'Failed to send invites.' };
  }
}

/**
 * Fetch all pending invites for the current user.
 * Strategy: pessimistic.
 */
export async function fetchMyInvites(): Promise<ServiceResult<Invite[]>> {
  try {
    await delay(300, 700);
    const mine = INVITES.filter(
      (inv) => inv.toUserId === CURRENT_USER_ID
    );
    return { data: mine, error: null };
  } catch (e: any) {
    return { data: null, error: e.message ?? 'Failed to load invites.' };
  }
}

/**
 * Accept or reject an invite.
 * Strategy: OPTIMISTIC — update local state immediately.
 */
export async function respondToInvite(
  inviteId: string,
  response: 'accepted' | 'rejected'
): Promise<ServiceResult<Invite>> {
  try {
    await delay(300, 600);
    const inv = INVITES.find((i) => i.id === inviteId);
    if (!inv) return { data: null, error: 'Invite not found.' };
    inv.status = response;
    return { data: { ...inv }, error: null };
  } catch (e: any) {
    return { data: null, error: e.message ?? 'Failed to respond to invite.' };
  }
}
