import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';
import { Screen } from '@/components/ui/Screen';

export default function ParcialesScreen() {
  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Parciales</Text>
        <Text style={styles.subtitle}>Countdown y preparación por parcial</Text>
      </View>
      <EmptyState
        icon="document-text-outline"
        title="Sin parciales cargados"
        description="Acá vas a ver el calendario de parciales y cuán preparada estás para cada uno."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
    gap: spacing.xxs,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
});
