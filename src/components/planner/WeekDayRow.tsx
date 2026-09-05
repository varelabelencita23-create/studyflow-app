import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { AnimatedRef, SharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Icon } from '@/components/ui/Icon';
import { colors, radius, spacing, typography } from '@/theme';
import { Subject } from '@/types';

interface WeekDayRowProps {
  animatedRef: AnimatedRef<Animated.View>;
  dayIndex: number;
  dayLabel: string;
  isToday: boolean;
  assignedSubject?: Subject;
  hoveredDayIndex: SharedValue<number>;
  onPressAssigned: () => void;
  onClear: () => void;
}

export function WeekDayRow({
  animatedRef,
  dayIndex,
  dayLabel,
  isToday,
  assignedSubject,
  hoveredDayIndex,
  onPressAssigned,
  onClear,
}: WeekDayRowProps) {
  const highlightStyle = useAnimatedStyle(() => {
    const isHovered = hoveredDayIndex.value === dayIndex;
    return {
      borderColor: withTiming(isHovered ? colors.accent : 'transparent', { duration: 150 }),
    };
  });

  return (
    <View style={styles.row}>
      <View style={styles.dayLabelColumn}>
        <Text style={styles.dayLabel}>{dayLabel}</Text>
        {isToday && <Text style={styles.todayBadge}>HOY</Text>}
      </View>

      <Animated.View ref={animatedRef} style={[styles.dropZoneWrapper, highlightStyle]} collapsable={false}>
        {assignedSubject ? (
          <Pressable onPress={onPressAssigned} style={styles.assignedCard}>
            <Text style={styles.assignedName} numberOfLines={1}>{assignedSubject.name}</Text>
            <Pressable hitSlop={10} onPress={onClear} style={styles.clearButton}>
              <Icon name="close" size={14} color={colors.onLightTextSecondary} />
            </Pressable>
          </Pressable>
        ) : (
          <View style={styles.emptyZone}>
            <Icon name="add-outline" size={16} color={colors.textTertiary} />
            <Text style={styles.emptyText}>Soltá una materia acá</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dayLabelColumn: {
    width: 68,
    gap: 2,
  },
  dayLabel: {
    ...typography.subheadline,
    color: colors.textPrimary,
  },
  todayBadge: {
    ...typography.caption2,
    color: colors.accent,
  },
  dropZoneWrapper: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: spacing.xxs,
  },
  emptyZone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  emptyText: {
    ...typography.footnote,
    color: colors.textTertiary,
  },
  assignedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.onLightSurface,
  },
  assignedName: {
    ...typography.headline,
    color: colors.onLightText,
    flex: 1,
    marginRight: spacing.sm,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.onLightOverlaySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
