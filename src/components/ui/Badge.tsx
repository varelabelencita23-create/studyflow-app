import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const palette = VARIANT_PALETTE[variant];
  return (
    <View style={[styles.base, { backgroundColor: palette.bg }]}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const VARIANT_PALETTE: Record<BadgeVariant, { bg: string; text: string }> = {
  neutral: { bg: colors.surfaceElevated, text: colors.textSecondary },
  accent: { bg: colors.accentSubtle, text: colors.accent },
  success: { bg: colors.successSubtle, text: colors.success },
  warning: { bg: colors.warningSubtle, text: colors.warning },
  danger: { bg: colors.dangerSubtle, text: colors.danger },
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  label: {
    ...typography.caption1,
  },
});
