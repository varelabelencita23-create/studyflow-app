import * as Haptics from 'expo-haptics';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  AnimatedRef,
  measure,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '@/theme';
import { Subject } from '@/types';

interface DraggableSubjectChipProps {
  subject: Subject;
  assignedCount: number;
  dayRefs: AnimatedRef<Animated.View>[];
  hoveredDayIndex: SharedValue<number>;
  onDrop: (dayIndex: number, subjectId: string) => void;
}

function triggerDragStartHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

function triggerDropHaptic() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function DraggableSubjectChip({
  subject,
  assignedCount,
  dayRefs,
  hoveredDayIndex,
  onDrop,
}: DraggableSubjectChipProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const pan = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      runOnJS(triggerDragStartHaptic)();
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;

      let matchedIndex = -1;
      for (let i = 0; i < dayRefs.length; i++) {
        const bounds = measure(dayRefs[i]);
        if (!bounds) continue;
        if (
          event.absoluteX >= bounds.pageX &&
          event.absoluteX <= bounds.pageX + bounds.width &&
          event.absoluteY >= bounds.pageY &&
          event.absoluteY <= bounds.pageY + bounds.height
        ) {
          matchedIndex = i;
          break;
        }
      }
      if (matchedIndex !== hoveredDayIndex.value) {
        hoveredDayIndex.value = matchedIndex;
      }
    })
    .onEnd(() => {
      const dayIndex = hoveredDayIndex.value;
      if (dayIndex >= 0) {
        runOnJS(onDrop)(dayIndex, subject.id);
        runOnJS(triggerDropHaptic)();
      }
      hoveredDayIndex.value = -1;
      isDragging.value = false;
      translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
      translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: withSpring(isDragging.value ? 1.08 : 1, { damping: 14 }) },
    ],
    zIndex: isDragging.value ? 100 : 1,
    elevation: isDragging.value ? 10 : 0,
    shadowOpacity: isDragging.value ? 0.35 : 0,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.chip, animatedStyle]}>
        <Text style={styles.label} numberOfLines={1}>
          {subject.shortName}
        </Text>
        {assignedCount > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{assignedCount}</Text>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
  },
  label: {
    ...typography.subheadline,
    fontFamily: typography.bodyMedium.fontFamily,
    color: colors.textPrimary,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  countText: {
    ...typography.caption2,
    color: colors.textPrimary,
  },
});
