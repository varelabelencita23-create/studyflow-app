import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Chip, Icon, Input, SegmentedTabs } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/hooks/useToast';
import { contentService, quizService } from '@/services';
import { colors, radius, spacing, typography } from '@/theme';
import { Difficulty, ID, Topic } from '@/types';

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Fácil' },
  { value: 'medium', label: 'Media' },
  { value: 'hard', label: 'Difícil' },
];

const COUNT_OPTIONS = [5, 10, 15, 20];

interface ManualQuestion {
  prompt: string;
  options: string[];
  correctOptionIndex: number;
}

export default function CrearTestScreen() {
  const router = useRouter();
  const { id: subjectId } = useLocalSearchParams<{ id: string }>();
  const { show } = useToast();

  const [mode, setMode] = useState<'generar' | 'manual'>('generar');
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<ID[]>([]);
  const [count, setCount] = useState(10);
  const [manualQuestions, setManualQuestions] = useState<ManualQuestion[]>([]);
  const [manualPrompt, setManualPrompt] = useState('');
  const [manualOptions, setManualOptions] = useState(['', '', '', '']);
  const [manualCorrectIndex, setManualCorrectIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!subjectId) return;
      contentService.listBySubject(subjectId).then(setTopics);
    }, [subjectId]),
  );

  const toggleTopic = (id: ID) => {
    setSelectedTopicIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const updateManualOption = (index: number, value: string) => {
    setManualOptions((current) => current.map((option, i) => (i === index ? value : option)));
  };

  const handleAddManualQuestion = () => {
    const trimmedOptions = manualOptions.map((option) => option.trim());
    if (manualPrompt.trim().length < 2 || trimmedOptions.some((option) => option.length === 0)) {
      show('Completá la pregunta y las 4 opciones', 'error');
      return;
    }
    setManualQuestions((current) => [
      ...current,
      { prompt: manualPrompt.trim(), options: trimmedOptions, correctOptionIndex: manualCorrectIndex },
    ]);
    setManualPrompt('');
    setManualOptions(['', '', '', '']);
    setManualCorrectIndex(0);
  };

  const removeManualQuestion = (index: number) => {
    setManualQuestions((current) => current.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!subjectId || name.trim().length < 2) {
      show('Ingresá un nombre para el test', 'error');
      return;
    }

    if (mode === 'generar') {
      const selectedTopics = topics.filter((topic) => selectedTopicIds.includes(topic.id));
      if (selectedTopics.length === 0) {
        show('Seleccioná al menos un contenido', 'error');
        return;
      }
      setSaving(true);
      try {
        const quiz = await quizService.addQuiz(subjectId, { name, difficulty });
        const generated = quizService.generateMockQuestions(selectedTopics, count);
        await quizService.addQuestionsBulk(quiz.id, generated);
        show('Test generado', 'success');
        router.back();
      } finally {
        setSaving(false);
      }
    } else {
      if (manualQuestions.length === 0) {
        show('Agregá al menos una pregunta', 'error');
        return;
      }
      setSaving(true);
      try {
        const quiz = await quizService.addQuiz(subjectId, { name, difficulty });
        await quizService.addQuestionsBulk(quiz.id, manualQuestions);
        show('Test creado', 'success');
        router.back();
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => router.back()} style={styles.backButton}>
          <Icon name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <Text style={styles.title}>Nuevo test</Text>

      <Input label="Nombre del test" placeholder="Ej. Redes — Parcial 1" value={name} onChangeText={setName} leftIcon="checkbox-outline" containerStyle={styles.field} />

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Dificultad</Text>
        <View style={styles.chipRow}>
          {DIFFICULTY_OPTIONS.map((option) => (
            <Chip key={option.value} label={option.label} selected={difficulty === option.value} onPress={() => setDifficulty(option.value)} />
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <SegmentedTabs
          options={[
            { label: 'Generar', value: 'generar' },
            { label: 'Manual', value: 'manual' },
          ]}
          value={mode}
          onChange={(value) => setMode(value as 'generar' | 'manual')}
        />
      </View>

      {mode === 'generar' ? (
        <>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Seleccionar contenidos</Text>
            {topics.length === 0 ? (
              <Text style={styles.emptyHint}>Esta materia todavía no tiene contenidos para generar preguntas.</Text>
            ) : (
              <View style={styles.topicList}>
                {topics.map((topic) => {
                  const isSelected = selectedTopicIds.includes(topic.id);
                  return (
                    <Pressable key={topic.id} onPress={() => toggleTopic(topic.id)} style={styles.topicRow}>
                      <Text style={styles.topicLabel} numberOfLines={1}>{topic.title}</Text>
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Icon name="checkmark" size={13} color="#FFFFFF" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Cantidad de preguntas</Text>
            <View style={styles.chipRow}>
              {COUNT_OPTIONS.map((option) => (
                <Chip key={option} label={`${option}`} selected={count === option} onPress={() => setCount(option)} />
              ))}
            </View>
          </View>

          <Button label="Generar test (mock)" size="lg" fullWidth loading={saving} onPress={handleSave} style={styles.saveButton} />
        </>
      ) : (
        <>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nueva pregunta</Text>
            <Input label="Pregunta" placeholder="Ej. ¿Qué es la herencia?" value={manualPrompt} onChangeText={setManualPrompt} containerStyle={styles.manualInput} />
            <Text style={styles.optionsHint}>Opciones (tocá el círculo para marcar la correcta)</Text>
            {manualOptions.map((option, index) => (
              <View key={index} style={styles.optionRow}>
                <Pressable hitSlop={8} onPress={() => setManualCorrectIndex(index)} style={styles.optionMark}>
                  <View style={[styles.optionRadio, manualCorrectIndex === index && styles.optionRadioSelected]}>
                    {manualCorrectIndex === index && <Icon name="checkmark" size={12} color="#FFFFFF" />}
                  </View>
                </Pressable>
                <Input
                  placeholder={`Opción ${index + 1}`}
                  value={option}
                  onChangeText={(value) => updateManualOption(index, value)}
                  containerStyle={styles.optionInput}
                />
              </View>
            ))}
            <Button label="Agregar pregunta" variant="secondary" icon="add" fullWidth onPress={handleAddManualQuestion} style={styles.addQuestionButton} />
          </View>

          {manualQuestions.length > 0 && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                {manualQuestions.length} {manualQuestions.length === 1 ? 'pregunta agregada' : 'preguntas agregadas'}
              </Text>
              <View style={styles.manualList}>
                {manualQuestions.map((question, index) => (
                  <View key={index} style={styles.manualQuestionRow}>
                    <Text style={styles.manualQuestionText} numberOfLines={1}>{question.prompt}</Text>
                    <Pressable hitSlop={8} onPress={() => removeManualQuestion(index)}>
                      <Icon name="close" size={16} color={colors.textTertiary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Button label="Crear test" size="lg" fullWidth loading={saving} onPress={handleSave} style={styles.saveButton} />
        </>
      )}
    </Screen>
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
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  field: {
    marginBottom: spacing.xl,
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
  emptyHint: {
    ...typography.subheadline,
    color: colors.textTertiary,
  },
  topicList: {
    gap: spacing.xs,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  topicLabel: {
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
  manualInput: {
    marginBottom: spacing.md,
  },
  optionsHint: {
    ...typography.caption1,
    color: colors.textTertiary,
    marginBottom: spacing.xxs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionMark: {
    width: 32,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioSelected: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  optionInput: {
    flex: 1,
  },
  addQuestionButton: {
    marginTop: spacing.sm,
  },
  manualList: {
    gap: spacing.xs,
  },
  manualQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  manualQuestionText: {
    ...typography.subheadline,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  saveButton: {
    marginBottom: spacing.xl,
  },
});
