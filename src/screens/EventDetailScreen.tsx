import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { fetchEventDetail, revokeRsvp, rsvpEvent } from '../services/api';
import { getUserById } from '../services/mockData';
import { Avatar, EmptyState, ErrorScreen, LoadingOverlay, PillButton, TagPill } from '../components/shared';
import { colors, font, radius, spacing } from '../theme';
import { Attendee, EventDetail, RootStackParamList, WaitlistEntry } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'EventDetail'>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function AttendeeRow({ attendee }: { attendee: Attendee }) {
  return (
    <View style={styles.attendeeRow}>
      <Avatar uri={attendee.avatar} size={36} name={attendee.name} />
      <Text style={styles.attendeeName} numberOfLines={1}>{attendee.name}</Text>
    </View>
  );
}

function WaitlistRow({ entry }: { entry: WaitlistEntry }) {
  return (
    <View style={styles.attendeeRow}>
      <View style={styles.positionBadge}>
        <Text style={styles.positionText}>#{entry.position}</Text>
      </View>
      <Avatar uri={entry.avatar} size={36} name={entry.name} />
      <Text style={styles.attendeeName} numberOfLines={1}>{entry.name}</Text>
    </View>
  );
}

export default function EventDetailScreen({ route, navigation }: Props) {
  const { eventId } = route.params;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchEventDetail(eventId);
    if (res.error) setError(res.error);
    else setEvent(res.data);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (event) {
      navigation.setOptions({ title: event.title.length > 22 ? event.title.slice(0, 22) + '…' : event.title });
    }
  }, [event, navigation]);

  const pulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const handleRSVP = async () => {
    if (!event) return;
    setRsvpLoading(true);
    pulse();
    const res = await rsvpEvent(event.id);
    if (res.error) {
      Toast.show({ type: 'error', text1: 'RSVP failed', text2: res.error });
    } else {
      const status = res.data!.status;
      if (status === 'going') {
        Toast.show({ type: 'success', text1: "You're going! 🎉", text2: `See you at ${event.title}` });
      } else {
        Toast.show({
          type: 'info',
          text1: `Waitlisted at #${res.data!.waitlistPosition}`,
          text2: "We'll notify you if a spot opens up.",
        });
      }
      await load();
    }
    setRsvpLoading(false);
  };

  const handleRevoke = async () => {
    if (!event) return;
    setRsvpLoading(true);
    pulse();
    const res = await revokeRsvp(event.id);
    if (res.error) {
      Toast.show({ type: 'error', text1: 'Cancellation failed', text2: res.error });
    } else {
      const promoted = res.data?.promoted;
      if (promoted) {
        const user = getUserById(promoted);
        Toast.show({
          type: 'success',
          text1: '🔔 Auto-promotion happened',
          text2: `${user?.name ?? 'Someone'} from the waitlist is now Going!`,
          visibilityTime: 3500,
        });
      } else {
        Toast.show({ type: 'info', text1: 'RSVP cancelled', text2: 'Your spot has been released.' });
      }
      await load();
    }
    setRsvpLoading(false);
  };

  if (loading) return <LoadingOverlay message="Loading event…" />;
  if (error || !event) return <ErrorScreen message={error ?? 'Event not found.'} onRetry={load} />;

  const spotsLeft = event.capacity - event.attendees.length;
  const isFull = spotsLeft <= 0;
  const host = getUserById(event.hostId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Cover */}
      <View style={styles.coverWrapper}>
        <Image source={{ uri: event.coverImage }} style={styles.cover} resizeMode="cover" />
        <View style={styles.coverOverlay} />
        {/* Capacity bar on cover */}
        <View style={styles.coverMeta}>
          <View style={[styles.capBadge, { backgroundColor: isFull ? colors.waitlistDim : colors.goingDim, borderColor: isFull ? colors.waitlist : colors.going }]}>
            <Text style={[styles.capBadgeText, { color: isFull ? colors.waitlist : colors.going }]}>
              {isFull ? '🔴 Full' : `🟢 ${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
            </Text>
          </View>
        </View>
      </View>

      {/* Title & Tags */}
      <View style={styles.section}>
        <Text style={styles.title}>{event.title}</Text>
        <View style={styles.tagsRow}>
          {event.tags.map((t) => <TagPill key={t} label={t} />)}
        </View>
      </View>

      {/* Meta */}
      <View style={styles.metaCard}>
        <MetaItem icon="📅" label={formatDate(event.date)} />
        <Divider />
        <MetaItem icon="📍" label={event.location} />
        <Divider />
        <MetaItem icon="👥" label={`${event.attendees.length} / ${event.capacity} going`} />
        {host && (
          <>
            <Divider />
            <View style={styles.hostRow}>
              <Text style={styles.metaIcon}>🎤</Text>
              <Avatar uri={host.avatar} size={28} name={host.name} />
              <Text style={styles.metaText}>Hosted by <Text style={styles.bold}>{host.name}</Text></Text>
            </View>
          </>
        )}
      </View>

      {/* Capacity Progress */}
      <View style={styles.section}>
        <View style={styles.barTrack}>
          <Animated.View
            style={[styles.barFill, {
              width: `${Math.min((event.attendees.length / event.capacity) * 100, 100)}%` as any,
              backgroundColor: isFull ? colors.waitlist : colors.accent,
              transform: [{ scaleX: pulseAnim }],
            }]}
          />
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>{event.description}</Text>
      </View>

      {/* RSVP CTA */}
      <View style={styles.rsvpBox}>
        {event.currentUserStatus === 'none' && (
          <PillButton
            label={isFull ? '⏳  Join Waitlist' : '🎉  RSVP – I\'m Going!'}
            onPress={handleRSVP}
            loading={rsvpLoading}
            variant="primary"
          />
        )}
        {event.currentUserStatus === 'going' && (
          <View style={styles.rsvpRow}>
            <View style={styles.goingChip}>
              <Text style={styles.goingChipText}>✓ You're Going!</Text>
            </View>
            <PillButton label="Cancel RSVP" onPress={handleRevoke} loading={rsvpLoading} variant="ghost" small />
          </View>
        )}
        {event.currentUserStatus === 'waitlisted' && (
          <View style={styles.rsvpRow}>
            <View style={styles.waitlistChip}>
              <Text style={styles.waitlistChipText}>⏳ Waitlisted #{event.waitlistPosition}</Text>
            </View>
            <PillButton label="Leave Waitlist" onPress={handleRevoke} loading={rsvpLoading} variant="ghost" small />
          </View>
        )}
      </View>

      {/* Attendee List Preview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Attendees ({event.attendees.length})</Text>
          {event.attendees.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('AttendeeList', { eventId: event.id })}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          )}
        </View>
        {event.attendees.length === 0 ? (
          <EmptyState emoji="👻" title="No one yet" subtitle="Be the first to RSVP!" />
        ) : (
          <View style={styles.attendeePreview}>
            {event.attendees.slice(0, 5).map((a) => (
              <View key={a.userId} style={styles.avatarStack}>
                <Avatar uri={a.avatar} size={40} name={a.name} />
              </View>
            ))}
            {event.attendees.length > 5 && (
              <View style={styles.moreChip}>
                <Text style={styles.moreChipText}>+{event.attendees.length - 5}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Waitlist */}
      {event.waitlist.length > 0 && (
        <View style={[styles.section, { marginBottom: spacing.xxl }]}>
          <Text style={styles.sectionTitle}>Waitlist ({event.waitlist.length})</Text>
          <View style={styles.listCard}>
            {event.waitlist.map((w) => <WaitlistRow key={w.userId} entry={w} />)}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function MetaItem({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaIcon}>{icon}</Text>
      <Text style={styles.metaText} numberOfLines={2}>{label}</Text>
    </View>
  );
}
function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: spacing.xxl },
  coverWrapper: { height: 240, position: 'relative' },
  cover: { width: '100%', height: '100%' },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,13,20,0.45)' },
  coverMeta: { position: 'absolute', bottom: spacing.md, left: spacing.md },
  capBadge: { paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1 },
  capBadgeText: { fontSize: font.sm, fontWeight: '700' },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.lg },
  title: { color: colors.text, fontSize: font.xxl, fontWeight: '800', lineHeight: 32 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  metaCard: { marginHorizontal: spacing.md, marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 0 },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.xs + 2 },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs + 2 },
  metaIcon: { fontSize: 16, marginTop: 1 },
  metaText: { color: colors.textSecondary, fontSize: font.md, flex: 1 },
  bold: { color: colors.text, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 2 },
  barTrack: { height: 5, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.full },
  sectionTitle: { color: colors.text, fontSize: font.lg, fontWeight: '700', marginBottom: spacing.sm },
  description: { color: colors.textSecondary, fontSize: font.md, lineHeight: 22 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  seeAll: { color: colors.accentLight, fontSize: font.sm, fontWeight: '600' },
  attendeePreview: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  avatarStack: {},
  moreChip: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  moreChipText: { color: colors.accentLight, fontSize: font.xs, fontWeight: '700' },
  listCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  attendeeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  attendeeName: { color: colors.text, fontSize: font.md, flex: 1, fontWeight: '500' },
  positionBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.waitlistDim, alignItems: 'center', justifyContent: 'center' },
  positionText: { color: colors.waitlist, fontSize: font.xs, fontWeight: '800' },
  rsvpBox: { marginHorizontal: spacing.md, marginTop: spacing.lg },
  rsvpRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  goingChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.goingDim, borderRadius: radius.full, borderWidth: 1, borderColor: colors.going },
  goingChipText: { color: colors.going, fontWeight: '700', fontSize: font.md },
  waitlistChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.waitlistDim, borderRadius: radius.full, borderWidth: 1, borderColor: colors.waitlist },
  waitlistChipText: { color: colors.waitlist, fontWeight: '700', fontSize: font.md },
});
