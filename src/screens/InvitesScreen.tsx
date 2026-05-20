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
import Toast from 'react-native-toast-message';
import { fetchMyInvites, respondToInvite } from '../services/api';
import { Avatar, EmptyState, ErrorScreen, LoadingOverlay, PillButton } from '../components/shared';
import { colors, font, radius, spacing } from '../theme';
import { Invite } from '../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function InviteCard({
  invite,
  onRespond,
}: {
  invite: Invite;
  onRespond: (id: string, r: 'accepted' | 'rejected') => void;
}) {
  const [loading, setLoading] = useState<'accepted' | 'rejected' | null>(null);

  const handle = async (r: 'accepted' | 'rejected') => {
    setLoading(r);
    await onRespond(invite.id, r);
    setLoading(null);
  };

  const isPending = invite.status === 'pending';
  const isAccepted = invite.status === 'accepted';
  const isRejected = invite.status === 'rejected';

  return (
    <View style={[styles.card, !isPending && styles.cardDim]}>
      {/* Event cover strip */}
      <View style={styles.coverStrip}>
        <Image source={{ uri: invite.eventCover }} style={styles.coverImg} resizeMode="cover" />
        <View style={styles.coverOverlay} />
        <View style={styles.coverContent}>
          <Text style={styles.eventTitle} numberOfLines={1}>{invite.eventTitle}</Text>
          <Text style={styles.eventDate}>📅 {formatDate(invite.eventDate)}</Text>
        </View>
      </View>

      {/* Invite body */}
      <View style={styles.body}>
        <View style={styles.fromRow}>
          <Avatar uri={invite.fromUserAvatar} size={36} name={invite.fromUserName} />
          <View style={styles.fromInfo}>
            <Text style={styles.fromName}>{invite.fromUserName}</Text>
            <Text style={styles.fromSub}>wants to plan together with you</Text>
          </View>
        </View>

        {isPending ? (
          <View style={styles.actions}>
            <PillButton
              label={loading === 'rejected' ? '' : '✗  Decline'}
              onPress={() => handle('rejected')}
              variant="ghost"
              loading={loading === 'rejected'}
              small
            />
            <PillButton
              label={loading === 'accepted' ? '' : '✓  Accept'}
              onPress={() => handle('accepted')}
              variant="success"
              loading={loading === 'accepted'}
              small
            />
          </View>
        ) : (
          <View style={[
            styles.resolvedBadge,
            { backgroundColor: isAccepted ? colors.goingDim : colors.border },
          ]}>
            <Text style={[
              styles.resolvedText,
              { color: isAccepted ? colors.going : colors.textMuted },
            ]}>
              {isAccepted ? '✓ Accepted' : '✗ Declined'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function InvitesScreen() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const res = await fetchMyInvites();
    if (res.error) setError(res.error);
    else setInvites(res.data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRespond = useCallback(async (inviteId: string, response: 'accepted' | 'rejected') => {
    // Optimistic update
    setInvites((prev) =>
      prev.map((inv) => inv.id === inviteId ? { ...inv, status: response } : inv)
    );
    const res = await respondToInvite(inviteId, response);
    if (res.error) {
      // Rollback
      setInvites((prev) =>
        prev.map((inv) => inv.id === inviteId ? { ...inv, status: 'pending' } : inv)
      );
      Toast.show({ type: 'error', text1: 'Failed', text2: res.error });
    } else {
      Toast.show({
        type: response === 'accepted' ? 'success' : 'info',
        text1: response === 'accepted' ? '🎉 Invite Accepted!' : 'Invite Declined',
        text2: response === 'accepted'
          ? `See you at ${res.data!.eventTitle}!`
          : 'Maybe next time.',
      });
    }
  }, []);

  if (loading) return <LoadingOverlay message="Loading invites…" />;
  if (error) return <ErrorScreen message={error} onRetry={() => load()} />;

  const pending = invites.filter((i) => i.status === 'pending');
  const resolved = invites.filter((i) => i.status !== 'pending');

  return (
    <View style={styles.container}>
      <FlatList
        data={invites}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <InviteCard invite={item} onRespond={handleRespond} />
        )}
        ListHeaderComponent={
          invites.length > 0 ? (
            <View style={styles.header}>
              <Text style={styles.headerText}>
                {pending.length > 0
                  ? `${pending.length} pending invite${pending.length !== 1 ? 's' : ''} 🔔`
                  : 'All caught up ✅'}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            emoji="📭"
            title="No invites yet"
            subtitle="When someone invites you to plan together, you'll see it here."
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
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  header: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerText: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '600' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDim: { opacity: 0.7 },
  coverStrip: { height: 80, position: 'relative' },
  coverImg: { width: '100%', height: '100%' },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,13,20,0.55)' },
  coverContent: { position: 'absolute', bottom: spacing.sm, left: spacing.md, right: spacing.md },
  eventTitle: { color: colors.white, fontSize: font.md, fontWeight: '700' },
  eventDate: { color: 'rgba(255,255,255,0.75)', fontSize: font.xs, marginTop: 2 },
  body: { padding: spacing.md, gap: spacing.md },
  fromRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fromInfo: { flex: 1 },
  fromName: { color: colors.text, fontSize: font.md, fontWeight: '700' },
  fromSub: { color: colors.textSecondary, fontSize: font.sm },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  resolvedBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  resolvedText: { fontSize: font.sm, fontWeight: '700' },
});
