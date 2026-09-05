import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/hooks/useToast';
import { colors, radius, spacing, typography } from '@/theme';
import { ID, Subject } from '@/types';

interface WeekSubjectPickerProps {
  visible: boolean;
  onClose: () => void;
  subjects: Subject[];
  selectedIds: ID[];
  maxSelectable: number;
  onSave: (ids: ID[]) => Promise<void> | void;
}

export function WeekSubjectPicker({
  visible,
  onClose,
  subjects,
  selectedIds,
  maxSelectable,
  onSave,
}: WeekSubjectPickerProps) {
  const { show } = useToast();
  const [localSelected, setLocalSelected] = useState<ID[]>(selectedIds);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setLocalSelected(selectedIds);
  }, [visible, selectedIds]);

  const toggle = (id: ID) => {
    setLocalSelected((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      if (current.length >= maxSelectable) {
        show(`Como máximo podés elegir ${maxSelectable} materias esta semana`, 'default');
        return current;
      }
      return [...current, id];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localSelected);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Materias de la semana</Text>
      <Text style={styles.subtitle}>
        {localSelected.length}/{maxSelectable} seleccionadas
      </Text>

      <View style={styles.list}>
        {subjects.map((subject) => {
          const isSelected = localSelected.includes(subject.id);
          return (
            <Pressable key={subject.id} onPress={() => toggle(subject.id)} style={styles.row}>
              <Text style={styles.rowLabel} numberOfLines={1}>{subject.name}</Text>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Icon name="checkmark" size={14} color="#FFFFFF" />}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Button
        label="Guardar"
        fullWidth
        loading={saving}
        disabled={localSelected.length === 0}
        onPress={handleSave}
        style={styles.saveButton}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.subheadline,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  rowLabel: {
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
  saveButton: {
    marginTop: spacing.lg,
  },
});
