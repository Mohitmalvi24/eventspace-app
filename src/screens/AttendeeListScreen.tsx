import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { fetchEventDetail, sendPlanTogetherInvites } from '../services/api';
import { CURRENT_USER_ID } from '../services/mockData';
import { Avatar, EmptyState, ErrorScreen, LoadingOverlay, PillButton } from '../components/shared';
import { colors, font, radius, spacing } from '../theme';
import { Attendee, EventDetail, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AttendeeList'>;

export default function AttendeeListScreen({ route, navigation }: Props) {
  const { eventId } = route.params;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchEventDetail(eventId);
    if (res.error) setError(res.error);
    else setEvent(res.data);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  const toggleSelect = (uid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const handleSendInvites = async () => {
    if (!event || selected.size === 0) return;
    setSending(true);
    const res = await sendPlanTogetherInvites(event.id, Array.from(selected));
    setSending(false);
    if (res.error) {
      Toast.show({ type: 'error', text1: 'Failed to send invites', text2: res.error });
      setShowConfirm(false);
    } else {
      setSentSuccess(true);
      setTimeout(() => {
        setShowConfirm(false);
        setSentSuccess(false);
        setSelected(new Set());
        Toast.show({
          type: 'success',
          text1: `📨 Invites sent to ${res.data!.length} ${res.data!.length === 1 ? 'person' : 'people'}`,
          text2: "They'll see it in their Invites tab.",
          visibilityTime: 3000,
        });
      }, 1200);
    }
  };

  if (loading) return <LoadingOverlay message="Loading attendees…" />;
  if (error || !event) return <ErrorScreen message={error ?? 'Not found.'} onRetry={load} />;

  const others = event.attendees.filter((a) => a.userId !== CURRENT_USER_ID);

  const renderItem = ({ item }: { item: Attendee }) => {
    const isSelected = selected.has(item.userId);
    return (
      <TouchableOpacity
        style={[styles.row, isSelected && styles.rowSelected]}
        onPress={() => toggleSelect(item.userId)}
        activeOpacity={0.8}
      >
        <Avatar uri={item.avatar} size={44} name={item.name} />
        <View style={styles.rowInfo}>
          <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.rowSub}>{isSelected ? '✓ Selected' : 'Tap to select'}</Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.hint}>
        <Text style={styles.hintText}>
          {selected.size === 0
            ? 'Select attendees to plan together 👇'
            : `${selected.size} selected — invite them to plan for this event`}
        </Text>
      </View>

      <FlatList
        data={others}
        keyExtractor={(a) => a.userId}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyState emoji="👥" title="No other attendees yet" />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {selected.size > 0 && (
        <View style={styles.stickyFooter}>
          <PillButton
            label={`🤝  Plan Together (${selected.size})`}
            onPress={() => setShowConfirm(true)}
            variant="primary"
          />
        </View>
      )}

      <Modal visible={showConfirm} transparent animationType="fade" onRequestClose={() => setShowConfirm(false)}>
        <Pressable style={styles.backdrop} onPress={() => !sending && setShowConfirm(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {sentSuccess ? (
              <View style={styles.successState}>
                <Text style={styles.successEmoji}>🎉</Text>
                <Text style={styles.successText}>Invites Sent!</Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalTitle}>Plan Together</Text>
                <Text style={styles.modalBody}>
                  Invite <Text style={styles.bold}>{selected.size} {selected.size === 1 ? 'person' : 'people'}</Text> to plan for{' '}
                  <Text style={styles.bold}>{event.title}</Text>?
                </Text>
                <View style={styles.selectedAvatars}>
                  {Array.from(selected).map((uid) => {
                    const a = event.attendees.find((x) => x.userId === uid);
                    return a ? (
                      <View key={uid} style={styles.avatarWrap}>
                        <Avatar uri={a.avatar} size={44} name={a.name} />
                        <Text style={styles.avatarName} numberOfLines={1}>{a.name.split(' ')[0]}</Text>
                      </View>
                    ) : null;
                  })}
                </View>
                <View style={styles.modalActions}>
                  <PillButton label="Cancel" onPress={() => setShowConfirm(false)} variant="ghost" small />
                  <PillButton
                    label="Send Invites 📨"
                    onPress={handleSendInvites}
                    loading={sending}
                    variant="primary"
                    small
                  />
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hint: { padding: spacing.sm + 2, backgroundColor: colors.accentDim, borderBottomWidth: 1, borderBottomColor: colors.border },
  hintText: { color: colors.accentLight, fontSize: font.sm, textAlign: 'center', fontWeight: '500' },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 120 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  rowSelected: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  rowInfo: { flex: 1 },
  rowName: { color: colors.text, fontSize: font.md, fontWeight: '600' },
  rowSub: { color: colors.textSecondary, fontSize: font.sm, marginTop: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark: { color: colors.white, fontSize: 13, fontWeight: '800' },
  stickyFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: colors.surfaceElevated, borderRadius: radius.xl, padding: spacing.xl, width: '100%', gap: spacing.md, borderWidth: 1, borderColor: colors.border },
  modalTitle: { color: colors.text, fontSize: font.xl, fontWeight: '800' },
  modalBody: { color: colors.textSecondary, fontSize: font.md, lineHeight: 22 },
  bold: { color: colors.text, fontWeight: '700' },
  selectedAvatars: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  avatarWrap: { alignItems: 'center', gap: 4, maxWidth: 60 },
  avatarName: { color: colors.textSecondary, fontSize: font.xs, textAlign: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  successState: { alignItems: 'center', paddingVertical: spacing.md, gap: spacing.sm },
  successEmoji: { fontSize: 48 },
  successText: { color: colors.success, fontSize: font.xl, fontWeight: '800' },
});
