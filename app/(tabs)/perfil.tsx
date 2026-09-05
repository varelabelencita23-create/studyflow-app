import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Icon, Input, BottomSheet, Switch } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { preferencesService, NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from '@/services';
import { useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { Screen } from '@/components/ui/Screen';
import { StudyMode } from '@/types';

const STUDY_MODE_LABEL: Record<StudyMode, string> = {
  standard: 'Estándar',
  deep: 'Profundo',
  free: 'Libre',
};

export default function PerfilScreen() {
  const router = useRouter();
  const { user, subjects, studyModeConfig, resetOnboarding, updateUser } = useAppState();
  const { show } = useToast();

  const [editVisible, setEditVisible] = useState(false);
  const [nameDraft, setNameDraft] = useState(user?.fullName ?? '');
  const [emailDraft, setEmailDraft] = useState(user?.email ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);

  useEffect(() => {
    preferencesService.getNotificationPreferences().then(setPreferences);
  }, []);

  const handleOpenEdit = () => {
    setNameDraft(user?.fullName ?? '');
    setEmailDraft(user?.email ?? '');
    setEditVisible(true);
  };

  const handleSaveProfile = async () => {
    if (nameDraft.trim().length < 2) {
      show('Ingresá un nombre válido', 'error');
      return;
    }
    if (!emailDraft.includes('@')) {
      show('Ingresá un email válido', 'error');
      return;
    }
    setSavingProfile(true);
    try {
      await updateUser({ fullName: nameDraft.trim(), email: emailDraft.trim().toLowerCase() });
      show('Perfil actualizado', 'success');
      setEditVisible(false);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleTogglePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    await preferencesService.setNotificationPreferences(next);
  };

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

      <Card variant="surface" style={styles.profileCard} onPress={handleOpenEdit}>
        <View style={styles.avatar}>
          <Icon name="person" size={28} color={colors.accent} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{user?.fullName ?? 'Sin nombre'}</Text>
          <Text style={styles.email}>{user?.email ?? '—'}</Text>
        </View>
        <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración</Text>

        <Card variant="surface" onPress={() => router.push('/perfil/modalidad')}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Icon name="options-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Modalidad de estudio</Text>
              <Text style={styles.rowSubtitle}>
                {STUDY_MODE_LABEL[studyModeConfig.studyMode]} · {studyModeConfig.maxSubjectsPerWeek}{' '}
                {studyModeConfig.maxSubjectsPerWeek === 1 ? 'materia' : 'materias'}/semana
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
          </View>
        </Card>

        <Card variant="surface" style={styles.notificationsCard}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Icon name="notifications-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Recordatorio diario</Text>
              <Text style={styles.rowSubtitle}>Un aviso para no perder el hábito de estudio.</Text>
            </View>
            <Switch
              value={preferences.dailyReminder}
              onValueChange={(value) => handleTogglePreference('dailyReminder', value)}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Icon name="alert-circle-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Alertas de parciales</Text>
              <Text style={styles.rowSubtitle}>Avisos cuando un parcial se acerca y vas atrasada.</Text>
            </View>
            <Switch
              value={preferences.examReminders}
              onValueChange={(value) => handleTogglePreference('examReminders', value)}
            />
          </View>
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

      <BottomSheet visible={editVisible} onClose={() => setEditVisible(false)}>
        <Text style={styles.sheetTitle}>Editar perfil</Text>
        <Input
          label="Nombre"
          value={nameDraft}
          onChangeText={setNameDraft}
          leftIcon="person-outline"
          containerStyle={styles.sheetField}
        />
        <Input
          label="Email"
          value={emailDraft}
          onChangeText={setEmailDraft}
          leftIcon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          containerStyle={styles.sheetField}
        />
        <Button label="Guardar" fullWidth loading={savingProfile} onPress={handleSaveProfile} style={styles.sheetSave} />
      </BottomSheet>
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
  section: {
    marginTop: spacing.xxxl,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
  },
  notificationsCard: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  rowTitle: {
    ...typography.subheadline,
    color: colors.textPrimary,
  },
  rowSubtitle: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
  },
  devSection: {
    marginTop: spacing.xxxl,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  sheetTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  sheetField: {
    marginBottom: spacing.md,
  },
  sheetSave: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
