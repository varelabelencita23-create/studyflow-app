import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';
import { colors, spacing, typography } from '@/theme';
import { ExamType, ISODateString } from '@/types';

const DAY_MS = 1000 * 60 * 60 * 24;

export interface ExamFormValues {
  title: string;
  type: ExamType;
  date: ISODateString;
}

interface ExamFormSheetProps {
  visible: boolean;
  onClose: () => void;
  sheetTitle: string;
  saveLabel: string;
  initial?: ExamFormValues;
  onSave: (values: ExamFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const TYPE_OPTIONS: { value: ExamType; label: string }[] = [
  { value: 'parcial', label: 'Parcial' },
  { value: 'recuperatorio', label: 'Recuperatorio' },
  { value: 'final', label: 'Final' },
  { value: 'trabajo-practico', label: 'Trabajo práctico' },
];

function daysFromNow(days: number): ISODateString {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function daysUntil(date: ISODateString): number {
  return Math.max(1, Math.ceil((new Date(date).getTime() - Date.now()) / DAY_MS));
}

export function ExamFormSheet({
  visible,
  onClose,
  sheetTitle,
  saveLabel,
  initial,
  onSave,
  onDelete,
}: ExamFormSheetProps) {
  const { show } = useToast();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ExamType>('parcial');
  const [daysAway, setDaysAway] = useState(14);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle(initial?.title ?? '');
      setType(initial?.type ?? 'parcial');
      setDaysAway(initial ? daysUntil(initial.date) : 14);
    }
  }, [visible, initial]);

  const handleSave = async () => {
    if (title.trim().length < 2) {
      show('Ingresá un título', 'error');
      return;
    }
    setSaving(true);
    try {
      await onSave({ title, type, date: daysFromNow(daysAway) });
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
        <Input label="Título" placeholder="Ej. Primer parcial" value={title} onChangeText={setTitle} leftIcon="document-text-outline" />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Tipo</Text>
          <View style={styles.chipRow}>
            {TYPE_OPTIONS.map((option) => (
              <Chip key={option.value} label={option.label} selected={type === option.value} onPress={() => setType(option.value)} />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Faltan</Text>
          <View style={styles.stepper}>
            <Pressable
              hitSlop={8}
              disabled={daysAway <= 1}
              onPress={() => setDaysAway((current) => Math.max(1, current - 1))}
              style={styles.stepperButton}
            >
              <Icon name="remove-circle-outline" size={26} color={daysAway <= 1 ? colors.textTertiary : colors.accent} />
            </Pressable>
            <Text style={styles.stepperValue}>{daysAway} {daysAway === 1 ? 'día' : 'días'}</Text>
            <Pressable hitSlop={8} onPress={() => setDaysAway((current) => Math.min(365, current + 1))} style={styles.stepperButton}>
              <Icon name="add-circle-outline" size={26} color={colors.accent} />
            </Pressable>
          </View>
        </View>

        <Button label={saveLabel} fullWidth loading={saving} onPress={handleSave} style={styles.saveButton} />
        {onDelete && <Button label="Eliminar parcial" variant="destructive" fullWidth onPress={handleDelete} />}
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.sm,
  },
  stepperButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    ...typography.headline,
    color: colors.textPrimary,
    minWidth: 96,
    textAlign: 'center',
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});
