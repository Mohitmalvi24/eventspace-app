import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchEvents } from '../services/api';
import { ATTENDEES_MAP, CURRENT_USER_ID, WAITLIST_MAP } from '../services/mockData';
import { EmptyState, ErrorScreen, LoadingOverlay, TagPill } from '../components/shared';
import { colors, font, radius, spacing } from '../theme';
import { Event, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getUserStatusForEvent(eventId: string): 'going' | 'waitlisted' | null {
  const attendees = ATTENDEES_MAP.get(eventId) ?? [];
  if (attendees.includes(CURRENT_USER_ID)) return 'going';
  const waitlist = WAITLIST_MAP.get(eventId) ?? [];
  if (waitlist.includes(CURRENT_USER_ID)) return 'waitlisted';
  return null;
}

function getCapacityInfo(event: Event) {
  const attending = (ATTENDEES_MAP.get(event.id) ?? []).length;
  const isFull = attending >= event.capacity;
  return { attending, isFull };
}

function EventCard({ event, onPress }: { event: Event; onPress: () => void }) {
  const status = getUserStatusForEvent(event.id);
  const { attending, isFull } = getCapacityInfo(event);
  const spotsLeft = event.capacity - attending;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: event.coverImage }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        {/* Gradient overlay */}
        <View style={styles.imageOverlay} />

        {/* Status badge */}
        {status && (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  status === 'going' ? colors.goingDim : colors.waitlistDim,
                borderColor:
                  status === 'going' ? colors.going : colors.waitlist,
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: status === 'going' ? colors.going : colors.waitlist },
              ]}
            >
              {status === 'going' ? '✓ Going' : '⏳ Waitlisted'}
            </Text>
          </View>
        )}

        {/* Capacity indicator */}
        <View style={styles.capacityBadge}>
          <Text
            style={[
              styles.capacityText,
              { color: isFull ? colors.waitlist : colors.going },
            ]}
          >
            {isFull ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>📅</Text>
          <Text style={styles.metaText}>{formatDate(event.date)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>📍</Text>
          <Text style={styles.metaText} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>👥</Text>
          <Text style={styles.metaText}>
            {attending} / {event.capacity} attending
          </Text>
        </View>

        {/* Capacity bar */}
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.min((attending / event.capacity) * 100, 100)}%` as any,
                backgroundColor: isFull ? colors.waitlist : colors.accent,
              },
            ]}
          />
        </View>

        {/* Tags */}
        <View style={styles.tagsRow}>
          {event.tags.map((t) => (
            <TagPill key={t} label={t} />
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function EventsScreen() {
  const navigation = useNavigation<Nav>();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const result = await fetchEvents();
    if (result.error) setError(result.error);
    else setEvents(result.data ?? []);

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refresh when coming back from detail (RSVP status may have changed)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      load(true);
    });
    return unsubscribe;
  }, [navigation, load]);

  if (loading) return <LoadingOverlay message="Fetching events…" />;
  if (error) return <ErrorScreen message={error} onRetry={() => load()} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() =>
              navigation.navigate('EventDetail', { eventId: item.id })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="🎉"
            title="No events yet"
            subtitle="Check back soon for upcoming events."
          />
        }
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageWrapper: { height: 180, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,13,20,0.35)',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: font.xs, fontWeight: '700' },
  capacityBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(13,13,20,0.7)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  capacityText: { fontSize: font.xs, fontWeight: '700' },
  cardBody: { padding: spacing.md, gap: spacing.xs },
  cardTitle: {
    color: colors.text,
    fontSize: font.lg,
    fontWeight: '700',
    marginBottom: 2,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaIcon: { fontSize: 13 },
  metaText: { color: colors.textSecondary, fontSize: font.sm, flex: 1 },
  barTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: radius.full },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
});
