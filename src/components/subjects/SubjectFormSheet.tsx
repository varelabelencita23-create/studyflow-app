import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';
import { colors, spacing, typography } from '@/theme';
import { Subject } from '@/types';

interface SubjectFormSheetProps {
  visible: boolean;
  onClose: () => void;
  editingSubject: Subject | null;
  onSave: (input: { name: string; professor?: string }) => Promise<void>;
  onDelete?: (subject: Subject) => Promise<void>;
}

/** Add/edit bottom sheet for a subject — shared by onboarding and the main Materias tab. */
export function SubjectFormSheet({ visible, onClose, editingSubject, onSave, onDelete }: SubjectFormSheetProps) {
  const { show } = useToast();
  const [name, setName] = useState('');
  const [professor, setProfessor] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(editingSubject?.name ?? '');
      setProfessor(editingSubject?.professor ?? '');
    }
  }, [visible, editingSubject]);

  const handleSave = async () => {
    if (name.trim().length < 2) {
      show('Ingresá el nombre de la materia', 'error');
      return;
    }
    setSaving(true);
    try {
      await onSave({ name, professor });
      show(editingSubject ? 'Materia actualizada' : 'Materia agregada', 'success');
      onClose();
    } catch (error) {
      show(error instanceof Error ? error.message : 'Algo salió mal', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingSubject || !onDelete) return;
    await onDelete(editingSubject);
    show('Materia eliminada', 'default');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>{editingSubject ? 'Editar materia' : 'Nueva materia'}</Text>
      <View style={styles.form}>
        <Input
          label="Nombre"
          placeholder="Ej. Sistemas Operativos"
          value={name}
          onChangeText={setName}
          leftIcon="book-outline"
        />
        <Input
          label="Profesor (opcional)"
          placeholder="Ej. Ana Gómez"
          value={professor}
          onChangeText={setProfessor}
          leftIcon="person-outline"
        />
        <Button
          label={editingSubject ? 'Guardar cambios' : 'Agregar materia'}
          fullWidth
          loading={saving}
          onPress={handleSave}
        />
        {editingSubject && onDelete && (
          <Button label="Eliminar materia" variant="destructive" fullWidth onPress={handleDelete} />
        )}
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
});
