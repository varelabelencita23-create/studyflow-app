import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Icon } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { Screen } from '@/components/ui/Screen';

export default function PerfilScreen() {
  const router = useRouter();
  const { user, subjects, studyModeConfig, resetOnboarding } = useAppState();
  const { show } = useToast();

  const handleResetOnboarding = async () => {
    await resetOnboarding();
    show('Onboarding reiniciado', 'default');
    router.replace('/welcome');
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
      </View>

      <Card variant="surface" style={styles.profileCard}>
        <View style={styles.avatar}>
          <Icon name="person" size={28} color={colors.accent} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{user?.fullName ?? 'Sin nombre'}</Text>
          <Text style={styles.email}>{user?.email ?? '—'}</Text>
        </View>
      </Card>

      <View style={styles.statsRow}>
        <Card variant="surface" style={styles.statCard}>
          <Text style={styles.statValue}>{subjects.length}</Text>
          <Text style={styles.statLabel}>Materias</Text>
        </Card>
        <Card variant="surface" style={styles.statCard}>
          <Text style={styles.statValue}>{studyModeConfig.maxSubjectsPerWeek}</Text>
          <Text style={styles.statLabel}>Por semana</Text>
        </Card>
      </View>

      <View style={styles.devSection}>
        <Text style={styles.sectionTitle}>Desarrollo</Text>
        <Button
          label="Ver Design System"
          variant="secondary"
          icon="color-palette-outline"
          fullWidth
          onPress={() => router.push('/design-system')}
        />
        <Button
          label="Reiniciar onboarding"
          variant="ghost"
          icon="refresh-outline"
          fullWidth
          onPress={handleResetOnboarding}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  name: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  email: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  statValue: {
    ...typography.title2,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  devSection: {
    marginTop: spacing.xxxl,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
  },
});
