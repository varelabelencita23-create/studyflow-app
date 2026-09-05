import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Icon, IconName } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/hooks/useToast';
import { DRIVE_ROOT_ID, driveService, fileService, MockDriveFile } from '@/services';
import { colors, radius, spacing, typography } from '@/theme';
import { FileKind, FolderCategory } from '@/types';

const FILE_KIND_ICON: Record<FileKind, IconName> = {
  pdf: 'document-outline',
  word: 'document-text-outline',
  image: 'image-outline',
  document: 'document-outline',
  other: 'attach-outline',
};

export default function DriveScreen() {
  const router = useRouter();
  const { subjectId, category } = useLocalSearchParams<{ subjectId: string; category: string }>();
  const { show } = useToast();

  const [connected, setConnected] = useState<boolean | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState(DRIVE_ROOT_ID);
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    driveService.isConnected().then(setConnected);
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    await driveService.connect();
    setConnected(true);
    setConnecting(false);
  };

  const currentFolder = driveService.getFolder(currentFolderId);
  const { folders, files } = driveService.listChildren(currentFolderId);

  const openFolder = (folderId: string) => {
    setFolderStack((current) => [...current, { id: currentFolderId, name: currentFolder?.name ?? 'Mi unidad' }]);
    setCurrentFolderId(folderId);
  };

  const goBackFolder = () => {
    const previous = folderStack[folderStack.length - 1];
    if (!previous) {
      router.back();
      return;
    }
    setFolderStack((current) => current.slice(0, -1));
    setCurrentFolderId(previous.id);
  };

  const toggleSelect = (fileId: string) => {
    setSelectedIds((current) =>
      current.includes(fileId) ? current.filter((id) => id !== fileId) : [...current, fileId],
    );
  };

  const handleImport = async () => {
    if (!subjectId || !category || selectedIds.length === 0) return;
    setImporting(true);
    try {
      const selectedFiles = selectedIds
        .map((id) => driveService.getFile(id))
        .filter((file): file is MockDriveFile => !!file);
      await Promise.all(
        selectedFiles.map((file) =>
          fileService.addFile(subjectId, category as FolderCategory, {
            name: file.name,
            kind: file.kind,
            source: 'google-drive',
          }),
        ),
      );
      show(`${selectedFiles.length} ${selectedFiles.length === 1 ? 'archivo importado' : 'archivos importados'}`, 'success');
      router.back();
    } finally {
      setImporting(false);
    }
  };

  if (connected === null) return null;

  return (
    <Screen edges={['top', 'bottom']} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => (connected ? goBackFolder() : router.back())} style={styles.backButton}>
          <Icon name={connected && folderStack.length > 0 ? 'chevron-back' : 'close'} size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{connected ? currentFolder?.name ?? 'Google Drive' : 'Google Drive'}</Text>
        <View style={styles.backButton} />
      </View>

      {!connected ? (
        <View style={styles.connectBlock}>
          <View style={styles.connectIcon}>
            <Icon name="logo-google" size={36} color={colors.accent} />
          </View>
          <Text style={styles.connectTitle}>Conectá tu Google Drive</Text>
          <Text style={styles.connectDescription}>
            Importá apuntes y archivos directamente desde tu Drive a esta materia.
          </Text>
          <Button label="Conectar Google Drive" size="lg" fullWidth loading={connecting} onPress={handleConnect} style={styles.connectButton} />
        </View>
      ) : (
        <>
          <View style={styles.list}>
            {folders.map((folder) => (
              <Pressable key={folder.id} onPress={() => openFolder(folder.id)} style={styles.row}>
                <View style={styles.rowIcon}>
                  <Icon name="folder-outline" size={18} color={colors.accent} />
                </View>
                <Text style={styles.rowLabel} numberOfLines={1}>{folder.name}</Text>
                <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
              </Pressable>
            ))}
            {files.map((file) => {
              const isSelected = selectedIds.includes(file.id);
              return (
                <Pressable key={file.id} onPress={() => toggleSelect(file.id)} style={styles.row}>
                  <View style={styles.rowIcon}>
                    <Icon name={FILE_KIND_ICON[file.kind]} size={18} color={colors.accent} />
                  </View>
                  <Text style={styles.rowLabel} numberOfLines={1}>{file.name}</Text>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Icon name="checkmark" size={13} color="#FFFFFF" />}
                  </View>
                </Pressable>
              );
            })}
            {folders.length === 0 && files.length === 0 && (
              <Text style={styles.emptyHint}>Esta carpeta está vacía.</Text>
            )}
          </View>

          <Button
            label={`Importar${selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}`}
            size="lg"
            fullWidth
            disabled={selectedIds.length === 0}
            loading={importing}
            onPress={handleImport}
            style={styles.importButton}
          />
        </>
      )}
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
  connectBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  connectIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xxl,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  connectTitle: {
    ...typography.title2,
    color: colors.textPrimary,
  },
  connectDescription: {
    ...typography.subheadline,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  connectButton: {
    width: '100%',
  },
  list: {
    flex: 1,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
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
  emptyHint: {
    ...typography.subheadline,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
  importButton: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
});
