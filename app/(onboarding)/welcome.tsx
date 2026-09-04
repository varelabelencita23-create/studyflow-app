import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { user } = useAppState();

  const handlePrimary = () => {
    router.push(user ? '/subjects' : '/auth?mode=register');
  };

  return (
    <Screen edges={['top', 'bottom']} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.iconWrapper}>
          <Icon name="school" size={44} color={colors.accent} />
        </View>
        <Text style={styles.title}>StudyFlow</Text>
        <Text style={styles.tagline}>
          Tu sistema operativo personal para la facultad. Distribuí tus materias,
          seguí tu progreso real y llegá preparada a cada parcial.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="Comenzar" size="lg" fullWidth onPress={handlePrimary} />
        <Button
          label="Ya tengo una cuenta"
          variant="ghost"
          size="lg"
          fullWidth
          onPress={() => router.push('/auth?mode=login')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: spacing.massive,
    paddingBottom: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: radius.xxl,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    gap: spacing.md,
  },
});
