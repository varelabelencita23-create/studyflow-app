import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';
import { colors, spacing, typography } from '@/theme';
import { Difficulty, Priority } from '@/types';
import { formatShortDate } from '@/utils';

export interface ContentMetaValues {
  title: string;
  priority: Priority;
  difficulty: Difficulty;
  targetDate?: string;
  importantForExam: boolean;
}

interface ContentMetaSheetProps {
  visible: boolean;
  onClose: () => void;
  sheetTitle: string;
  saveLabel: string;
  initial: ContentMetaValues;
  onSave: (values: ContentMetaValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  deleteLabel?: string;
}

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Fácil' },
  { value: 'medium', label: 'Media' },
  { value: 'hard', label: 'Difícil' },
];

function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/** Shared add/edit form for Topics and Subtopics — title, priority, difficulty, target date, exam flag. */
export function ContentMetaSheet({
  visible,
  onClose,
  sheetTitle,
  saveLabel,
  initial,
  onSave,
  onDelete,
  deleteLabel = 'Eliminar',
}: ContentMetaSheetProps) {
  const { show } = useToast();
  const [title, setTitle] = useState(initial.title);
  const [priority, setPriority] = useState<Priority>(initial.priority);
  const [difficulty, setDifficulty] = useState<Difficulty>(initial.difficulty);
  const [targetDate, setTargetDate] = useState<string | undefined>(initial.targetDate);
  const [importantForExam, setImportantForExam] = useState(initial.importantForExam);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle(initial.title);
      setPriority(initial.priority);
      setDifficulty(initial.difficulty);
      setTargetDate(initial.targetDate);
      setImportantForExam(initial.importantForExam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleSave = async () => {
    if (title.trim().length < 2) {
      show('Ingresá un título', 'error');
      return;
    }
    setSaving(true);
    try {
      await onSave({ title, priority, difficulty, targetDate, importantForExam });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    await onDelete();
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>{sheetTitle}</Text>
      <View style={styles.form}>
        <Input label="Título" placeholder="Ej. Herencia" value={title} onChangeText={setTitle} leftIcon="list-outline" />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Prioridad</Text>
          <View style={styles.chipRow}>
            {PRIORITY_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={priority === option.value}
                onPress={() => setPriority(option.value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Dificultad</Text>
          <View style={styles.chipRow}>
            {DIFFICULTY_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={difficulty === option.value}
                onPress={() => setDifficulty(option.value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            Fecha objetivo{' '}
            <Text style={styles.fieldValue}>
              {targetDate ? `· ${formatShortDate(targetDate)}` : '· sin fecha'}
            </Text>
          </Text>
          <View style={styles.chipRow}>
            <Chip label="Sin fecha" selected={!targetDate} onPress={() => setTargetDate(undefined)} />
            <Chip label="Esta semana" onPress={() => setTargetDate(addDays(7))} />
            <Chip label="Este mes" onPress={() => setTargetDate(addDays(30))} />
          </View>
        </View>

        <Chip
          label="Importante para el parcial"
          icon={importantForExam ? 'star' : 'star-outline'}
          selected={importantForExam}
          onPress={() => setImportantForExam((current) => !current)}
        />

        <Button label={saveLabel} fullWidth loading={saving} onPress={handleSave} style={styles.saveButton} />
        {onDelete && <Button label={deleteLabel} variant="destructive" fullWidth onPress={handleDelete} />}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.sm,
  },
  fieldLabel: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  fieldValue: {
    color: colors.textTertiary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});
