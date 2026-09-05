import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet, Button, EmptyState, Icon, IconName, Input } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/hooks/useToast';
import { fileService } from '@/services';
import { useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { FileKind, FileSource, FolderCategory, StudyMaterial } from '@/types';

const FILE_KIND_ICON: Record<FileKind, IconName> = {
  pdf: 'document-outline',
  word: 'document-text-outline',
  image: 'image-outline',
  document: 'document-outline',
  other: 'attach-outline',
};

const FILE_SOURCE_LABEL: Record<FileSource, string> = {
  device: 'Dispositivo',
  camera: 'Cámara',
  gallery: 'Galería',
  'google-drive': 'Google Drive',
};

const ADD_OPTIONS: { source: FileSource; label: string; icon: IconName; kind: FileKind; namePrefix: string; extension: string }[] = [
  { source: 'device', label: 'Dispositivo', icon: 'folder-open-outline', kind: 'document', namePrefix: 'Documento', extension: 'pdf' },
  { source: 'camera', label: 'Cámara', icon: 'camera-outline', kind: 'image', namePrefix: 'Foto', extension: 'jpg' },
  { source: 'gallery', label: 'Galería', icon: 'images-outline', kind: 'image', namePrefix: 'Imagen', extension: 'png' },
];

export default function ArchivosCategoryScreen() {
  const router = useRouter();
  const { id: subjectId, category } = useLocalSearchParams<{ id: string; category: string }>();
  const { subjects } = useAppState();
  const { show } = useToast();

  const subject = subjects.find((item) => item.id === subjectId);
  const folderDef = fileService.FOLDER_DEFS.find((def) => def.category === category);

  const [files, setFiles] = useState<StudyMaterial[]>([]);
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<StudyMaterial | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const load = useCallback(() => {
    if (!subjectId || !folderDef) return;
    fileService.listFiles(subjectId, folderDef.category).then(setFiles);
  }, [subjectId, folderDef]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!subject || !folderDef) {
    return (
      <Screen edges={['top', 'bottom']}>
        <HeaderBar onBack={() => router.back()} />
        <Text style={styles.notFound}>No encontramos esta carpeta.</Text>
      </Screen>
    );
  }

  const handleAdd = async (option: (typeof ADD_OPTIONS)[number]) => {
    const countSameSource = files.filter((file) => file.source === option.source).length + 1;
    await fileService.addFile(subjectId, folderDef.category, {
      name: `${option.namePrefix} ${countSameSource}.${option.extension}`,
      kind: option.kind,
      source: option.source,
    });
    setAddSheetVisible(false);
    show('Archivo agregado', 'success');
    load();
  };

  const handleGoToDrive = () => {
    setAddSheetVisible(false);
    router.push(`/drive?subjectId=${subjectId}&category=${folderDef.category}`);
  };

  const openFileSheet = (file: StudyMaterial) => {
    setSelectedFile(file);
    setRenaming(false);
    setRenameValue(file.name);
  };

  const handleRename = async () => {
    if (!selectedFile || renameValue.trim().length < 1) return;
    await fileService.renameFile(selectedFile.id, renameValue);
    setSelectedFile(null);
    load();
  };

  const handleDelete = async () => {
    if (!selectedFile) return;
    await fileService.removeFile(selectedFile.id);
    setSelectedFile(null);
    show('Archivo eliminado', 'default');
    load();
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <HeaderBar onBack={() => router.back()} />

      <Text style={styles.title}>{folderDef.name}</Text>
      <Text style={styles.subtitle}>{subject.name}</Text>

      {files.length === 0 ? (
        <EmptyState
          icon="folder-open-outline"
          title="Esta carpeta está vacía"
          description="Agregá tu primer archivo desde el dispositivo, la cámara, la galería o Google Drive."
          actionLabel="Agregar archivo"
          onAction={() => setAddSheetVisible(true)}
        />
      ) : (
        <View style={styles.list}>
          {files.map((file) => (
            <Pressable key={file.id} onPress={() => openFileSheet(file)} style={styles.fileRow}>
              <View style={styles.fileIcon}>
                <Icon name={FILE_KIND_ICON[file.kind]} size={18} color={colors.accent} />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                <Text style={styles.fileSource}>{FILE_SOURCE_LABEL[file.source]}</Text>
              </View>
              <Icon name="ellipsis-horizontal" size={18} color={colors.textTertiary} />
            </Pressable>
          ))}
          <Button label="Agregar archivo" variant="secondary" icon="add" fullWidth onPress={() => setAddSheetVisible(true)} />
        </View>
      )}

      <BottomSheet visible={addSheetVisible} onClose={() => setAddSheetVisible(false)}>
        <Text style={styles.sheetTitle}>Agregar archivo</Text>
        <View style={styles.optionList}>
          {ADD_OPTIONS.map((option) => (
            <Pressable key={option.source} onPress={() => handleAdd(option)} style={styles.optionRow}>
              <View style={styles.optionIcon}>
                <Icon name={option.icon} size={18} color={colors.accent} />
              </View>
              <Text style={styles.optionLabel}>{option.label}</Text>
            </Pressable>
          ))}
          <Pressable onPress={handleGoToDrive} style={styles.optionRow}>
            <View style={styles.optionIcon}>
              <Icon name="logo-google" size={18} color={colors.accent} />
            </View>
            <Text style={styles.optionLabel}>Google Drive</Text>
          </Pressable>
        </View>
      </BottomSheet>

      <BottomSheet visible={!!selectedFile} onClose={() => setSelectedFile(null)}>
        {selectedFile && (
          <>
            <Text style={styles.sheetTitle}>{selectedFile.name}</Text>
            <Text style={styles.sheetSubtitle}>{FILE_SOURCE_LABEL[selectedFile.source]}</Text>

            {renaming ? (
              <View style={styles.renameForm}>
                <Input label="Nombre" value={renameValue} onChangeText={setRenameValue} leftIcon="pencil-outline" />
                <Button label="Guardar" fullWidth onPress={handleRename} />
              </View>
            ) : (
              <View style={styles.sheetActions}>
                <Button label="Renombrar" variant="secondary" fullWidth onPress={() => setRenaming(true)} />
                <Button label="Eliminar archivo" variant="destructive" fullWidth onPress={handleDelete} />
              </View>
            )}
          </>
        )}
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
  list: {
    gap: spacing.sm,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  fileName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  fileSource: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  sheetTitle: {
    ...typography.title3,
    color: colors.textPrimary,
  },
  sheetSubtitle: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    marginBottom: spacing.lg,
  },
  optionList: {
    gap: spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  sheetActions: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  renameForm: {
    gap: spacing.lg,
    marginTop: spacing.md,
  },
});
