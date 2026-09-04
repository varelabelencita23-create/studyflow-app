import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '@/theme';
import { Icon, IconName } from './Icon';

interface SelectableCardProps {
  title: string;
  description?: string;
  icon?: IconName;
  selected: boolean;
  onPress: () => void;
  children?: ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SelectableCard({ title, description, icon, selected, onPress, children }: SelectableCardProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.98, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 150 });
      }}
      style={[styles.base, selected && styles.selected, animatedStyle]}
    >
      <View style={styles.row}>
        {icon && (
          <View style={[styles.iconWrapper, selected && styles.iconWrapperSelected]}>
            <Icon name={icon} size={20} color={selected ? colors.accent : colors.textSecondary} />
          </View>
        )}
        <View style={styles.textColumn}>
          <Text style={styles.title}>{title}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioDot} />}
        </View>
      </View>
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  selected: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSubtle,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperSelected: {
    backgroundColor: colors.surfaceHighlight,
  },
  textColumn: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  description: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.accent,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
});
