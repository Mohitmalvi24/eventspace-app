import { Attendee, Event, Invite, User, WaitlistEntry } from '../types';

// ─── Users ───────────────────────────────────────────────────────────────────

export const CURRENT_USER_ID = 'u1';

export const USERS: User[] = [
  {
    id: 'u1',
    name: 'Alex Rivera',
    avatar: 'https://i.pravatar.cc/150?img=11',
    bio: 'Design enthusiast & weekend hiker.',
  },
  {
    id: 'u2',
    name: 'Priya Shah',
    avatar: 'https://i.pravatar.cc/150?img=47',
    bio: 'Product builder. Coffee snob.',
  },
  {
    id: 'u3',
    name: 'Marcus Lim',
    avatar: 'https://i.pravatar.cc/150?img=68',
    bio: 'Developer, gamer, occasional chef.',
  },
  {
    id: 'u4',
    name: 'Sana Iqbal',
    avatar: 'https://i.pravatar.cc/150?img=32',
    bio: 'Artist & community builder.',
  },
  {
    id: 'u5',
    name: 'Jordan Torres',
    avatar: 'https://i.pravatar.cc/150?img=15',
    bio: 'Startup founder. Loves live music.',
  },
  {
    id: 'u6',
    name: 'Nadia Okonkwo',
    avatar: 'https://i.pravatar.cc/150?img=23',
    bio: 'Photographer & world traveller.',
  },
  {
    id: 'u7',
    name: 'Ben Hartley',
    avatar: 'https://i.pravatar.cc/150?img=52',
    bio: 'Film buff and aspiring screenwriter.',
  },
  {
    id: 'u8',
    name: 'Yuki Tanaka',
    avatar: 'https://i.pravatar.cc/150?img=60',
    bio: 'UX researcher. Board game addict.',
  },
];

// ─── Events ──────────────────────────────────────────────────────────────────

export const EVENTS: Event[] = [
  {
    id: 'e1',
    title: 'Design Systems Workshop',
    description:
      'A hands-on deep-dive into building scalable design systems from scratch. We\'ll cover tokens, component libraries, and documentation strategies used by top product teams. Bring your laptop!',
    date: '2026-06-07T14:00:00Z',
    location: 'The Commons, Bengaluru',
    capacity: 4,
    coverImage: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=80',
    hostId: 'u2',
    tags: ['Design', 'Workshop', 'Tech'],
  },
  {
    id: 'e2',
    title: 'Indie Dev Mixer',
    description:
      'Network with indie makers, solo founders, and hobbyist coders. Show your side projects, get feedback, and find potential co-founders. Light snacks and good vibes included.',
    date: '2026-06-14T18:30:00Z',
    location: 'Koramangala Social, Bengaluru',
    capacity: 3,
    coverImage: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80',
    hostId: 'u3',
    tags: ['Networking', 'Tech', 'Social'],
  },
  {
    id: 'e3',
    title: 'Sunday Rooftop Cinema',
    description:
      'Join us for a curated outdoor screening under the stars. This month\'s pick is a cult classic from the 90s — no spoilers! BYOB, blankets encouraged.',
    date: '2026-06-21T19:00:00Z',
    location: 'Rooftop at Indiranagar, Bengaluru',
    capacity: 6,
    coverImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
    hostId: 'u7',
    tags: ['Cinema', 'Social', 'Outdoor'],
  },
  {
    id: 'e4',
    title: 'AI Product Strategy Roundtable',
    description:
      'A curated conversation for PMs and founders on how to ship AI-native products responsibly. Structured as an Oxford-style debate followed by open discussion.',
    date: '2026-06-28T11:00:00Z',
    location: 'WeWork Galaxy, Bengaluru',
    capacity: 5,
    coverImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
    hostId: 'u5',
    tags: ['AI', 'Product', 'Workshop'],
  },
];

// ─── Attendees (mutable in-memory store) ────────────────────────────────────

// Map<eventId, Set<userId>>
export const ATTENDEES_MAP: Map<string, string[]> = new Map([
  ['e1', ['u2', 'u3', 'u4', 'u5']], // full at capacity=4
  ['e2', ['u3', 'u6']],              // 2/3
  ['e3', ['u7', 'u4', 'u5']],        // 3/6
  ['e4', ['u5', 'u2']],              // 2/5
]);

// Map<eventId, userId[]> — ordered waitlist
export const WAITLIST_MAP: Map<string, string[]> = new Map([
  ['e1', ['u6', 'u7']], // e1 is full so has waitlist
  ['e2', []],
  ['e3', []],
  ['e4', []],
]);

// ─── Invites ─────────────────────────────────────────────────────────────────

export const INVITES: Invite[] = [
  {
    id: 'inv1',
    eventId: 'e1',
    eventTitle: 'Design Systems Workshop',
    eventDate: '2026-06-07T14:00:00Z',
    eventCover: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&q=80',
    fromUserId: 'u2',
    fromUserName: 'Priya Shah',
    fromUserAvatar: 'https://i.pravatar.cc/150?img=47',
    toUserId: 'u1',
    status: 'pending',
    createdAt: '2026-05-18T09:00:00Z',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getUserById(id: string): User | undefined {
  return USERS.find((u) => u.id === id);
}

export function getAttendeesForEvent(eventId: string): Attendee[] {
  const ids = ATTENDEES_MAP.get(eventId) ?? [];
  return ids.map((uid) => {
    const u = getUserById(uid)!;
    return { userId: u.id, name: u.name, avatar: u.avatar };
  });
}

export function getWaitlistForEvent(eventId: string): WaitlistEntry[] {
  const ids = WAITLIST_MAP.get(eventId) ?? [];
  return ids.map((uid, index) => {
    const u = getUserById(uid)!;
    return { userId: u.id, name: u.name, avatar: u.avatar, position: index + 1 };
  });
}
