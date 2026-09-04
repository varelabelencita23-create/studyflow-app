import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Icon } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';
import { Screen } from '@/components/ui/Screen';

export default function PerfilScreen() {
  const router = useRouter();

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
          <Text style={styles.name}>Vare</Text>
          <Text style={styles.email}>varelabelencita23@gmail.com</Text>
        </View>
      </Card>

      <View style={styles.devSection}>
        <Text style={styles.sectionTitle}>Desarrollo</Text>
        <Button
          label="Ver Design System"
          variant="secondary"
          icon="color-palette-outline"
          fullWidth
          onPress={() => router.push('/design-system')}
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
  devSection: {
    marginTop: spacing.xxxl,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
  },
});
