import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { colors, font, radius, spacing } from '../theme';

// ─── Loading Overlay ──────────────────────────────────────────────────────────

export function LoadingOverlay({ message = 'Loading…' }: { message?: string }) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

// ─── Full-screen Error ────────────────────────────────────────────────────────

export function ErrorScreen({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({
  emoji = '🔍',
  title,
  subtitle,
}: {
  emoji?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ─── Tag Pill ─────────────────────────────────────────────────────────────────

export function TagPill({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

import { Image } from 'react-native';

export function Avatar({
  uri,
  size = 40,
  name,
}: {
  uri?: string;
  size?: number;
  name?: string;
}) {
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        defaultSource={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(name ?? '?')}&background=7C5CFC&color=fff` }}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatarFallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarInitials, { fontSize: size * 0.35 }]}>
        {initials}
      </Text>
    </View>
  );
}

// ─── Pill Button ──────────────────────────────────────────────────────────────

interface PillButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'ghost' | 'success';
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
}

export function PillButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  small = false,
}: PillButtonProps) {
  const bg =
    variant === 'primary'
      ? colors.accent
      : variant === 'danger'
      ? colors.error
      : variant === 'success'
      ? colors.going
      : 'transparent';

  const borderColor =
    variant === 'ghost' ? colors.border : 'transparent';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.pillBtn,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === 'ghost' ? 1 : 0,
          opacity: disabled ? 0.5 : 1,
          paddingVertical: small ? spacing.xs : spacing.sm,
          paddingHorizontal: small ? spacing.md : spacing.lg,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.white} />
      ) : (
        <Text
          style={[
            styles.pillBtnText,
            { color: variant === 'ghost' ? colors.textSecondary : colors.white },
            small && { fontSize: font.sm },
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Inline Loading Row ───────────────────────────────────────────────────────

export function InlineLoader() {
  return (
    <View style={styles.inlineLoader}>
      <ActivityIndicator size="small" color={colors.accent} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: font.md,
    marginTop: spacing.sm,
  },
  errorIcon: { fontSize: 40 },
  errorTitle: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.text,
  },
  errorMessage: {
    fontSize: font.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },
  retryText: { color: colors.white, fontWeight: '700', fontSize: font.md },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.sm },
  emptyTitle: {
    fontSize: font.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: font.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tag: {
    backgroundColor: colors.tagBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  tagText: { color: colors.accentLight, fontSize: font.xs, fontWeight: '600' },
  avatar: { backgroundColor: colors.surfaceElevated },
  avatarFallback: {
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { color: colors.accentLight, fontWeight: '700' },
  pillBtn: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  pillBtnText: { fontWeight: '700', fontSize: font.md },
  inlineLoader: { padding: spacing.md, alignItems: 'center' },
});
