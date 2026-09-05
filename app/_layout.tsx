import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplashView } from '@/components/SplashView';
import { ToastProvider } from '@/components/ui/Toast';
import { ActiveSessionProvider, AppStateProvider, useAppState } from '@/store';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { isLoading } = useAppState();

  if (isLoading) {
    return <SplashView />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="design-system" options={{ presentation: 'card' }} />
      <Stack.Screen name="materia/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="materia/[id]/contenidos" options={{ presentation: 'card' }} />
      <Stack.Screen name="materia/[id]/plan" options={{ presentation: 'card' }} />
      <Stack.Screen name="materia/[id]/archivos" options={{ presentation: 'card' }} />
      <Stack.Screen name="materia/[id]/archivos/[category]" options={{ presentation: 'card' }} />
      <Stack.Screen name="materia/[id]/parciales" options={{ presentation: 'card' }} />
      <Stack.Screen name="materia/[id]/flashcards" options={{ presentation: 'card' }} />
      <Stack.Screen name="materia/[id]/flashcards/crear" options={{ presentation: 'card' }} />
      <Stack.Screen name="materia/[id]/flashcards/[deckId]/estudiar" options={{ presentation: 'card' }} />
      <Stack.Screen name="materia/[id]/tests" options={{ presentation: 'card' }} />
      <Stack.Screen name="materia/[id]/tests/crear" options={{ presentation: 'card' }} />
      <Stack.Screen name="materia/[id]/tests/[quizId]/realizar" options={{ presentation: 'card' }} />
      <Stack.Screen name="parcial/[examId]" options={{ presentation: 'card' }} />
      <Stack.Screen name="perfil/modalidad" options={{ presentation: 'card' }} />
      <Stack.Screen name="sesion/nueva" options={{ presentation: 'card' }} />
      <Stack.Screen name="sesion/timer" options={{ presentation: 'card', gestureEnabled: false }} />
      <Stack.Screen name="sesion/resumen" options={{ presentation: 'card', gestureEnabled: false }} />
      <Stack.Screen name="sesion/[sessionId]" options={{ presentation: 'card' }} />
      <Stack.Screen name="drive" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppStateProvider>
          <ActiveSessionProvider>
            <ToastProvider>
              <StatusBar style="light" />
              <RootNavigator />
            </ToastProvider>
          </ActiveSessionProvider>
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
