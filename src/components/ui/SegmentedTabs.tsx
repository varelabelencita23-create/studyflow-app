import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '@/theme';

export interface SegmentedTabOption {
  label: string;
  value: string;
}

interface SegmentedTabsProps {
  options: SegmentedTabOption[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedTabs({ options, value, onChange }: SegmentedTabsProps) {
  const [segmentWidth, setSegmentWidth] = useState(0);
  const translateX = useSharedValue(0);

  const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));

  const handleLayout = (event: LayoutChangeEvent) => {
    const width = (event.nativeEvent.layout.width - 4) / options.length;
    setSegmentWidth(width);
    translateX.value = width * activeIndex;
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: segmentWidth,
  }));

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {segmentWidth > 0 && <Animated.View style={[styles.indicator, indicatorStyle]} />}
      {options.map((option, index) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={styles.segment}
            onPress={() => {
              Haptics.selectionAsync();
              translateX.value = withTiming(segmentWidth * index, { duration: 220 });
              onChange(option.value);
            }}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xxs,
    position: 'relative',
  },
  segment: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  indicator: {
    position: 'absolute',
    top: spacing.xxs,
    bottom: spacing.xxs,
    left: spacing.xxs,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceHighlight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  label: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.textPrimary,
    fontFamily: typography.bodyMedium.fontFamily,
  },
});
