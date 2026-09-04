import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { colors, spacing, typography } from '@/theme';
import { Screen } from '@/components/ui/Screen';

export default function MateriasScreen() {
  const { show } = useToast();

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Materias</Text>
        <Text style={styles.subtitle}>Organizá todo tu cuatrimestre</Text>
      </View>
      <EmptyState
        icon="book-outline"
        title="Todavía no agregaste materias"
        description="En la próxima etapa vas a poder crear, editar y ordenar tus materias."
        actionLabel="Agregar materia"
        onAction={() => show('Disponible en la próxima etapa', 'default')}
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
