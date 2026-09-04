import { BlurView } from 'expo-blur';
import { Redirect, Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { Icon, IconName } from '@/components/ui/Icon';
import { useAppState } from '@/store';
import { colors } from '@/theme';

interface TabIconConfig {
  focused: IconName;
  unfocused: IconName;
}

const TAB_ICONS: Record<string, TabIconConfig> = {
  index: { focused: 'home', unfocused: 'home-outline' },
  materias: { focused: 'book', unfocused: 'book-outline' },
  parciales: { focused: 'document-text', unfocused: 'document-text-outline' },
  estadisticas: { focused: 'stats-chart', unfocused: 'stats-chart-outline' },
  perfil: { focused: 'person-circle', unfocused: 'person-circle-outline' },
};

export default function TabsLayout() {
  const { onboardingCompleted } = useAppState();

  if (!onboardingCompleted) {
    return <Redirect href="/welcome" />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return (
            <Icon
              name={focused ? icons.focused : icons.unfocused}
              size={size}
              color={color as string}
            />
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="materias" options={{ title: 'Materias' }} />
      <Tabs.Screen name="parciales" options={{ title: 'Parciales' }} />
      <Tabs.Screen name="estadisticas" options={{ title: 'Estadísticas' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: Platform.select({ ios: 'transparent', default: 'rgba(10,10,12,0.97)' }),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    height: Platform.select({ ios: 88, default: 64 }),
    paddingTop: 8,
  },
  tabBarItem: {
    paddingTop: 2,
  },
  tabBarLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    marginTop: 2,
  },
});
