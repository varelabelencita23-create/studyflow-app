import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet, Button, Chip, Icon, Input } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/hooks/useToast';
import { contentService } from '@/services';
import { useActiveSession, useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { ID, Topic } from '@/types';

const GOAL_OPTIONS = [15, 30, 45, 60];

export default function NuevaSesionScreen() {
  const router = useRouter();
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const { subjects } = useAppState();
  const { activeSession, startSession } = useActiveSession();
  const { show } = useToast();

  const subject = subjects.find((item) => item.id === subjectId);

  const [contents, setContents] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<ID[]>([]);
  const [goalMinutes, setGoalMinutes] = useState<number | null>(null);
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeSession) {
      router.replace('/sesion/timer');
      return;
    }
    if (!subjectId) return;
    (async () => {
      const list = await contentService.listBySubject(subjectId);
      setContents(list);
      setLoading(false);
    })();
  }, [subjectId, activeSession]);

  const toggleContent = (id: ID) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const handleAddContent = async () => {
    if (!subjectId || newTitle.trim().length < 2) {
      show('Ingresá un título', 'error');
      return;
    }
    setSaving(true);
    try {
      const units = await contentService.listUnits(subjectId);
      const unit = units[0] ?? (await contentService.addUnit(subjectId, 'General'));
      const topic = await contentService.addTopic(unit.id, subjectId, newTitle);
      setContents((current) => [...current, topic]);
      setSelectedIds((current) => [...current, topic.id]);
      setNewTitle('');
      setAddSheetVisible(false);
    } finally {
      setSaving(false);
    }
  };

  const handleStart = () => {
    if (!subject) return;
    startSession(subject.id, subject.name, selectedIds, goalMinutes);
    router.replace('/sesion/timer');
  };

  if (!subject) {
    return (
      <Screen edges={['top', 'bottom']}>
        <HeaderBar onBack={() => router.back()} />
        <Text style={styles.notFound}>No encontramos esta materia.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <HeaderBar onBack={() => router.back()} />

      <Text style={styles.title}>Nueva sesión</Text>
      <Text style={styles.subtitle}>{subject.name}</Text>

      <Text style={styles.sectionLabel}>¿Qué vas a estudiar?</Text>
      {!loading && contents.length === 0 && (
        <Text style={styles.emptyHint}>Todavía no agregaste contenidos para esta materia.</Text>
      )}
      <View style={styles.contentList}>
        {contents.map((topic) => {
          const isSelected = selectedIds.includes(topic.id);
          return (
            <Pressable key={topic.id} onPress={() => toggleContent(topic.id)} style={styles.contentRow}>
              <Text style={styles.contentLabel} numberOfLines={1}>{topic.title}</Text>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Icon name="checkmark" size={14} color={colors.textPrimary} />}
              </View>
            </Pressable>
          );
        })}
        <Pressable onPress={() => setAddSheetVisible(true)} style={styles.addRow}>
          <Icon name="add" size={16} color={colors.accent} />
          <Text style={styles.addRowText}>Agregar contenido</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>Objetivo (opcional)</Text>
      <View style={styles.goalRow}>
        {GOAL_OPTIONS.map((minutes) => (
          <Chip
            key={minutes}
            label={`${minutes} min`}
            selected={goalMinutes === minutes}
            onPress={() => setGoalMinutes((current) => (current === minutes ? null : minutes))}
          />
        ))}
      </View>

      <Button label="Iniciar sesión" size="lg" fullWidth onPress={handleStart} style={styles.startButton} />

      <BottomSheet visible={addSheetVisible} onClose={() => setAddSheetVisible(false)}>
        <Text style={styles.sheetTitle}>Nuevo contenido</Text>
        <Input
          label="Título"
          placeholder="Ej. Subnetting"
          value={newTitle}
          onChangeText={setNewTitle}
          leftIcon="list-outline"
        />
        <Button label="Agregar" fullWidth loading={saving} onPress={handleAddContent} style={styles.sheetButton} />
      </BottomSheet>
    </Screen>
  );
}

function HeaderBar({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable hitSlop={12} onPress={onBack} style={styles.backButton}>
        <Icon name="chevron-back" size={22} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    ...typography.body,
    color: colors.textSecondary,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.subheadline,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    ...typography.footnote,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.md,
  },
  emptyHint: {
    ...typography.subheadline,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  contentList: {
    gap: spacing.xs,
    marginBottom: spacing.xxl,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  contentLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  addRowText: {
    ...typography.subheadline,
    color: colors.accent,
  },
  goalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  startButton: {
    marginBottom: spacing.xl,
  },
  sheetTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  sheetButton: {
    marginTop: spacing.lg,
  },
});
