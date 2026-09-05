import * as Haptics from 'expo-haptics';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, radius, shadows, spacing } from '@/theme';

export type CardVariant = 'surface' | 'elevated' | 'outline' | 'light';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: CardVariant;
  padding?: number;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({ children, onPress, variant = 'surface', padding = spacing.lg, style }: CardProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (!onPress) {
    return <Animated.View style={[styles.base, VARIANT_STYLES[variant], { padding }, style]}>{children}</Animated.View>;
  }

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={() => {
        scale.value = withTiming(0.98, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 150 });
      }}
      style={[styles.base, VARIANT_STYLES[variant], { padding }, animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}

const VARIANT_STYLES: Record<CardVariant, ViewStyle> = {
  surface: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  elevated: {
    backgroundColor: colors.surfaceElevated,
    ...shadows.md,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  light: {
    backgroundColor: colors.onLightSurface,
    ...shadows.md,
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
  },
});
