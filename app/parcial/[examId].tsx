import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, BadgeVariant, BottomSheet, Button, Card, Icon, IconName, ProgressBar } from '@/components/ui';
import { ExamFormSheet } from '@/components/exams';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/hooks/useToast';
import { contentService, examService, fileService } from '@/services';
import { useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { Exam, ExamPace, ExamReadiness, ExamType, StudyMaterial, Topic } from '@/types';
import { inferFileKind } from '@/utils';

const TYPE_LABEL: Record<ExamType, string> = {
  parcial: 'Parcial',
  recuperatorio: 'Recuperatorio',
  final: 'Final',
  'trabajo-practico': 'Trabajo práctico',
};

const PACE_INFO: Record<ExamPace, { label: string; variant: BadgeVariant }> = {
  ahead: { label: 'Vas adelantada', variant: 'success' },
  'on-track': { label: 'Vas bien', variant: 'accent' },
  behind: { label: 'Estás atrasada', variant: 'danger' },
};

const ADD_FILE_OPTIONS: { source: 'device' | 'camera' | 'gallery'; label: string; icon: IconName }[] = [
  { source: 'device', label: 'Dispositivo', icon: 'folder-open-outline' },
  { source: 'camera', label: 'Cámara', icon: 'camera-outline' },
  { source: 'gallery', label: 'Galería', icon: 'images-outline' },
];

export default function ExamDetailScreen() {
  const router = useRouter();
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const { subjects } = useAppState();
  const { show } = useToast();

  const [exam, setExam] = useState<Exam | null | undefined>(undefined);
  const [readiness, setReadiness] = useState<ExamReadiness | null>(null);
  const [linkedTopics, setLinkedTopics] = useState<Topic[]>([]);
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [material, setMaterial] = useState<StudyMaterial | null>(null);

  const [editVisible, setEditVisible] = useState(false);
  const [topicPickerVisible, setTopicPickerVisible] = useState(false);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [addFileVisible, setAddFileVisible] = useState(false);

  const subject = exam ? subjects.find((item) => item.id === exam.subjectId) : undefined;

  const load = useCallback(async () => {
    if (!examId) return;
    const found = await examService.get(examId);
    if (!found) {
      setExam(null);
      return;
    }

    // Gather everything before touching state: `exam` and `readiness` must
    // become non-null together, otherwise a render could catch `exam` set
    // with `readiness` still null and crash on `readiness!.daysRemaining`.
    const subjectForExam = subjects.find((item) => item.id === found.subjectId);
    const [readinessResult, topics, material] = await Promise.all([
      examService.getReadiness(found, subjectForExam?.progress ?? 0),
      contentService.listBySubject(found.subjectId),
      found.materialFileId ? fileService.getById(found.materialFileId) : Promise.resolve(null),
    ]);

    setExam(found);
    setReadiness(readinessResult);
    setAllTopics(topics);
    setLinkedTopics(topics.filter((topic) => found.topicIds.includes(topic.id)));
    setMaterial(material);
  }, [examId, subjects]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (exam === undefined) return null;

  if (!exam || !subject) {
    return (
      <Screen edges={['top', 'bottom']}>
        <HeaderBar onBack={() => router.back()} />
        <Text style={styles.notFound}>No encontramos este parcial.</Text>
      </Screen>
    );
  }

  const countdownLabel =
    readiness!.daysRemaining > 0
      ? `Faltan ${readiness!.daysRemaining} ${readiness!.daysRemaining === 1 ? 'día' : 'días'}`
      : readiness!.daysRemaining === 0
        ? 'Es hoy'
        : `Fue hace ${Math.abs(readiness!.daysRemaining)} ${Math.abs(readiness!.daysRemaining) === 1 ? 'día' : 'días'}`;

  const paceInfo = PACE_INFO[readiness!.pace];

  const openTopicPicker = () => {
    setSelectedTopicIds(exam.topicIds);
    setTopicPickerVisible(true);
  };

  const toggleTopic = (id: string) => {
    setSelectedTopicIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const handleSaveTopics = async () => {
    await examService.setTopics(exam.id, selectedTopicIds);
    setTopicPickerVisible(false);
    load();
  };

  const handleAddFile = async (option: (typeof ADD_FILE_OPTIONS)[number]) => {
    setAddFileVisible(false);
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
          picked = { uri: asset.uri, name: asset.fileName ?? `parcial-${Date.now()}.jpg`, mimeType: asset.mimeType };
        }
      }

      if (!picked) return;

      const created = await fileService.uploadFile(exam.subjectId, 'parciales', {
        uri: picked.uri,
        name: picked.name,
        mimeType: picked.mimeType ?? undefined,
        kind: inferFileKind(picked.mimeType, picked.name),
        source: option.source,
      });
      await examService.attachMaterial(exam.id, created.id);
      show('Archivo adjuntado', 'success');
      load();
    } catch (error) {
      show(error instanceof Error ? error.message : 'No se pudo adjuntar el archivo', 'error');
    }
  };

  const handleOpenMaterial = async () => {
    if (!material) return;
    try {
      const url = await fileService.getSignedUrl(material);
      await Linking.openURL(url);
    } catch (error) {
      show(error instanceof Error ? error.message : 'No se pudo abrir el archivo', 'error');
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <HeaderBar onBack={() => router.back()} />

      <Text style={styles.subjectName}>{subject.name}</Text>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{exam.title}</Text>
        <Pressable hitSlop={8} onPress={() => setEditVisible(true)} style={styles.editButton}>
          <Icon name="pencil-outline" size={16} color={colors.textSecondary} />
        </Pressable>
      </View>
      <Badge label={TYPE_LABEL[exam.type]} variant="neutral" />

      <View style={styles.countdownBlock}>
        <Text style={styles.countdownValue}>{countdownLabel}</Text>
        <Badge label={paceInfo.label} variant={paceInfo.variant} />
      </View>

      <ProgressBar
        progress={readiness!.percentPrepared}
        showLabel
        label="Preparación"
        style={styles.progress}
      />

      <View style={styles.paceRow}>
        <Card variant="surface" style={styles.paceCard}>
          <Text style={styles.paceValue}>{readiness!.currentPacePerDay} min</Text>
          <Text style={styles.paceLabel}>Tu ritmo actual / día</Text>
        </Card>
        <Card variant="surface" style={styles.paceCard}>
          <Text style={styles.paceValue}>{readiness!.requiredPacePerDay} min</Text>
          <Text style={styles.paceLabel}>Ritmo necesario / día</Text>
        </Card>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Contenidos</Text>
          <Button label="Vincular" variant="ghost" size="sm" onPress={openTopicPicker} />
        </View>
        {linkedTopics.length === 0 ? (
          <Text style={styles.emptyHint}>Todavía no vinculaste contenidos a este parcial.</Text>
        ) : (
          <View style={styles.topicList}>
            {linkedTopics.map((topic) => (
              <View key={topic.id} style={styles.topicRow}>
                <Icon
                  name={topic.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={topic.status === 'completed' ? colors.success : colors.textTertiary}
                />
                <Text style={styles.topicLabel} numberOfLines={1}>{topic.title}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Archivo</Text>
          {!material && <Button label="Adjuntar" variant="ghost" size="sm" onPress={() => setAddFileVisible(true)} />}
        </View>
        {material ? (
          <Pressable style={styles.fileCard} onPress={handleOpenMaterial}>
            <View style={styles.fileIcon}>
              <Icon name="document-outline" size={18} color={colors.accent} />
            </View>
            <Text style={styles.fileName} numberOfLines={1}>{material.name}</Text>
            <Icon name="open-outline" size={16} color={colors.textTertiary} />
          </Pressable>
        ) : (
          <Text style={styles.emptyHint}>Sin archivo adjunto.</Text>
        )}
      </View>

      <ExamFormSheet
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        sheetTitle="Editar parcial"
        saveLabel="Guardar cambios"
        initial={{ title: exam.title, type: exam.type, date: exam.date }}
        onSave={async (values) => {
          await examService.update(exam.id, values);
          load();
        }}
        onDelete={async () => {
          await examService.remove(exam.id);
          router.back();
        }}
      />

      <BottomSheet visible={topicPickerVisible} onClose={() => setTopicPickerVisible(false)}>
        <Text style={styles.sheetTitle}>Vincular contenidos</Text>
        {allTopics.length === 0 ? (
          <Text style={styles.emptyHint}>Esta materia todavía no tiene contenidos.</Text>
        ) : (
          <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
            {allTopics.map((topic) => {
              const isSelected = selectedTopicIds.includes(topic.id);
              return (
                <Pressable key={topic.id} onPress={() => toggleTopic(topic.id)} style={styles.pickerRow}>
                  <Text style={styles.pickerLabel} numberOfLines={1}>{topic.title}</Text>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Icon name="checkmark" size={13} color={colors.textPrimary} />}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
        <Button label="Guardar" fullWidth onPress={handleSaveTopics} style={styles.pickerSave} />
      </BottomSheet>

      <BottomSheet visible={addFileVisible} onClose={() => setAddFileVisible(false)}>
        <Text style={styles.sheetTitle}>Adjuntar archivo</Text>
        <View style={styles.pickerList}>
          {ADD_FILE_OPTIONS.map((option) => (
            <Pressable key={option.source} onPress={() => handleAddFile(option)} style={styles.optionRow}>
              <View style={styles.fileIcon}>
                <Icon name={option.icon} size={18} color={colors.accent} />
              </View>
              <Text style={styles.pickerLabel}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
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
  subjectName: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    flex: 1,
  },
  editButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownBlock: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  countdownValue: {
    ...typography.title1,
    color: colors.textPrimary,
  },
  progress: {
    marginBottom: spacing.lg,
  },
  paceRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  paceCard: {
    flex: 1,
    gap: spacing.xxs,
  },
  paceValue: {
    ...typography.title2,
    color: colors.textPrimary,
  },
  paceLabel: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.xxxl,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
  },
  emptyHint: {
    ...typography.footnote,
    color: colors.textTertiary,
  },
  topicList: {
    gap: spacing.sm,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topicLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  fileIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  sheetTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  pickerList: {
    gap: spacing.xs,
    maxHeight: 320,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  pickerLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
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
  pickerSave: {
    marginTop: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
});
