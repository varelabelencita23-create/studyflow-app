import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
      <Stack.Screen name="auth" />
      <Stack.Screen name="forgot-password" options={{ presentation: 'modal' }} />
      <Stack.Screen name="subjects" options={{ gestureEnabled: false }} />
      <Stack.Screen name="study-mode" options={{ gestureEnabled: false }} />
      <Stack.Screen name="complete" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
