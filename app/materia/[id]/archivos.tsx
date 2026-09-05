import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, IconName } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { fileService } from '@/services';
import { useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { Folder, FolderCategory } from '@/types';

const FOLDER_ICONS: Record<FolderCategory, IconName> = {
  apuntes: 'document-text-outline',
  clases: 'easel-outline',
  'trabajos-practicos': 'construct-outline',
  parciales: 'school-outline',
  'material-extra': 'sparkles-outline',
};

export default function ArchivosScreen() {
  const router = useRouter();
  const { id: subjectId } = useLocalSearchParams<{ id: string }>();
  const { subjects } = useAppState();

  const subject = subjects.find((item) => item.id === subjectId);
  const [folders, setFolders] = useState<Folder[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!subjectId) return;
      fileService.listFolders(subjectId).then(setFolders);
    }, [subjectId]),
  );

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

      <Text style={styles.title}>Archivos</Text>
      <Text style={styles.subtitle}>{subject.name}</Text>

      <View style={styles.list}>
        {folders.map((folder) => (
          <Pressable
            key={folder.id}
            onPress={() => router.push(`/materia/${subject.id}/archivos/${folder.category}`)}
            style={styles.folderRow}
          >
            <View style={styles.folderIcon}>
              <Icon name={FOLDER_ICONS[folder.category]} size={20} color={colors.accent} />
            </View>
            <View style={styles.folderInfo}>
              <Text style={styles.folderName}>{folder.name}</Text>
              <Text style={styles.folderCount}>
                {folder.fileCount} {folder.fileCount === 1 ? 'archivo' : 'archivos'}
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
        ))}
      </View>
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
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  folderIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  folderName: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  folderCount: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
});
