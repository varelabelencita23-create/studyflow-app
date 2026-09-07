import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Icon } from '@/components/ui/Icon';
import { colors, radius, spacing, typography } from '@/theme';

/**
 * Branded splash rendered while the app bootstraps its Supabase-backed
 * state (session, subjects, onboarding status). The native splash screen
 * (see app.json) covers the very first paint; this takes over once the JS
 * bundle is running, until AppStateProvider finishes loading.
 */
export function SplashView() {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 450 });
    scale.value = withTiming(1, { duration: 450 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, animatedStyle]}>
        <View style={styles.iconWrapper}>
          <Icon name="school" size={36} color={colors.accent} />
        </View>
        <Text style={styles.wordmark}>StudyFlow</Text>
      </Animated.View>
      <ActivityIndicator style={styles.spinner} color={colors.textTertiary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    ...typography.title1,
    color: colors.textPrimary,
  },
  spinner: {
    position: 'absolute',
    bottom: 80,
  },
});
