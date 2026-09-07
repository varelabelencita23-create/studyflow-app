import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet, Button, EmptyState, Icon, IconName, Input, SkeletonCard } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/hooks/useToast';
import { fileService } from '@/services';
import { useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { FileKind, FileSource, StudyMaterial } from '@/types';
import { inferFileKind } from '@/utils';

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

const ADD_OPTIONS: { source: FileSource; label: string; icon: IconName }[] = [
  { source: 'device', label: 'Dispositivo', icon: 'folder-open-outline' },
  { source: 'camera', label: 'Cámara', icon: 'camera-outline' },
  { source: 'gallery', label: 'Galería', icon: 'images-outline' },
];

export default function ArchivosCategoryScreen() {
  const router = useRouter();
  const { id: subjectId, category } = useLocalSearchParams<{ id: string; category: string }>();
  const { subjects } = useAppState();
  const { show } = useToast();

  const subject = subjects.find((item) => item.id === subjectId);
  const folderDef = fileService.FOLDER_DEFS.find((def) => def.category === category);

  const [files, setFiles] = useState<StudyMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<StudyMaterial | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const load = useCallback(async () => {
    if (!subjectId || !folderDef) return;
    const fileList = await fileService.listFiles(subjectId, folderDef.category);
    setFiles(fileList);
    setIsLoading(false);
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
    setAddSheetVisible(false);
    try {
      let picked: { uri: string; name: string; mimeType?: string | null } | null = null;

      if (option.source === 'device') {
        const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
        if (!result.canceled && result.assets[0]) picked = result.assets[0];
      } else {
        const permission =
          option.source === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          show('Necesitamos permiso para continuar', 'error');
          return;
        }
        const result =
          option.source === 'camera'
            ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
            : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          picked = { uri: asset.uri, name: asset.fileName ?? `foto-${Date.now()}.jpg`, mimeType: asset.mimeType };
        }
      }

      if (!picked) return;

      await fileService.uploadFile(subjectId, folderDef.category, {
        uri: picked.uri,
        name: picked.name,
        mimeType: picked.mimeType ?? undefined,
        kind: inferFileKind(picked.mimeType, picked.name),
        source: option.source,
      });
      show('Archivo subido', 'success');
      load();
    } catch (error) {
      show(error instanceof Error ? error.message : 'No se pudo subir el archivo', 'error');
    }
  };

  const handleOpenFile = async (file: StudyMaterial) => {
    try {
      const url = await fileService.getSignedUrl(file);
      await Linking.openURL(url);
    } catch (error) {
      show(error instanceof Error ? error.message : 'No se pudo abrir el archivo', 'error');
    }
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

      {isLoading ? (
        <View style={styles.list}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : files.length === 0 ? (
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
                <Button label="Abrir archivo" icon="open-outline" fullWidth onPress={() => handleOpenFile(selectedFile)} />
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
