import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing, typography } from '@/theme';

const MISSING_REQUIREMENTS = [
  'Un proyecto en Google Cloud Console con la Drive API habilitada',
  'Un OAuth Client ID (y su redirect URI) registrado para esta app',
  'Autenticación en la app vía expo-auth-session (o un Edge Function de Supabase que intercambie el token)',
];

/**
 * Honest placeholder: Google Drive import needs real OAuth credentials that
 * don't exist yet (see `driveService.ts`). Rather than fake a "Connect" flow
 * with mock folders, this screen says plainly what's missing.
 */
export default function DriveScreen() {
  const router = useRouter();

  return (
    <Screen edges={['top', 'bottom']} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => router.back()} style={styles.backButton}>
          <Icon name="close" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Google Drive</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.body}>
        <View style={styles.icon}>
          <Icon name="logo-google" size={36} color={colors.textTertiary} />
        </View>
        <Text style={styles.title}>Todavía no está conectado</Text>
        <Text style={styles.description}>
          Importar desde Google Drive necesita credenciales que esta app no tiene configuradas. Por ahora podés
          subir archivos desde el dispositivo, la cámara o la galería.
        </Text>

        <View style={styles.requirementsCard}>
          <Text style={styles.requirementsTitle}>Falta configurar</Text>
          {MISSING_REQUIREMENTS.map((requirement) => (
            <View key={requirement} style={styles.requirementRow}>
              <View style={styles.requirementBullet}>
                <Icon name="ellipse" size={5} color={colors.textTertiary} />
              </View>
              <Text style={styles.requirementText}>{requirement}</Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: radius.xxl,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title2,
    color: colors.textPrimary,
  },
  description: {
    ...typography.subheadline,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  requirementsCard: {
    width: '100%',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  requirementsTitle: {
    ...typography.footnote,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  requirementBullet: {
    marginTop: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementText: {
    ...typography.subheadline,
    color: colors.textPrimary,
    flex: 1,
  },
});
