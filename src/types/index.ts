// ─── Core Types ──────────────────────────────────────────────────────────────

export type RSVPStatus = 'going' | 'waitlisted' | 'none';

export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string
  location: string;
  capacity: number;
  coverImage: string;
  hostId: string;
  tags: string[];
}

export interface EventDetail extends Event {
  attendees: Attendee[];
  waitlist: WaitlistEntry[];
  currentUserStatus: RSVPStatus;
  waitlistPosition?: number; // only when currentUserStatus === 'waitlisted'
}

export interface Attendee {
  userId: string;
  name: string;
  avatar: string;
}

export interface WaitlistEntry {
  userId: string;
  name: string;
  avatar: string;
  position: number;
}

export type InviteStatus = 'pending' | 'accepted' | 'rejected';

export interface Invite {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventCover: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  toUserId: string;
  status: InviteStatus;
  createdAt: string;
}

// ─── Service Response Shapes ─────────────────────────────────────────────────

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

// ─── Navigation Types ─────────────────────────────────────────────────────────

export type RootTabParamList = {
  Events: undefined;
  Invites: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  EventDetail: { eventId: string };
  AttendeeList: { eventId: string };
};
