import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Chip, Icon, Input, SegmentedTabs } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/hooks/useToast';
import { contentService, flashcardService } from '@/services';
import { colors, radius, spacing, typography } from '@/theme';
import { Difficulty, ID, Topic } from '@/types';

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Fácil' },
  { value: 'medium', label: 'Media' },
  { value: 'hard', label: 'Difícil' },
];

const COUNT_OPTIONS = [5, 10, 15, 20];

interface ManualCard {
  question: string;
  answer: string;
}

export default function CrearMazoScreen() {
  const router = useRouter();
  const { id: subjectId } = useLocalSearchParams<{ id: string }>();
  const { show } = useToast();

  const [mode, setMode] = useState<'generar' | 'manual'>('generar');
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<ID[]>([]);
  const [count, setCount] = useState(10);
  const [manualCards, setManualCards] = useState<ManualCard[]>([]);
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualAnswer, setManualAnswer] = useState('');
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

  const handleAddManualCard = () => {
    if (manualQuestion.trim().length < 2 || manualAnswer.trim().length < 1) {
      show('Completá la pregunta y la respuesta', 'error');
      return;
    }
    setManualCards((current) => [...current, { question: manualQuestion.trim(), answer: manualAnswer.trim() }]);
    setManualQuestion('');
    setManualAnswer('');
  };

  const removeManualCard = (index: number) => {
    setManualCards((current) => current.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!subjectId || name.trim().length < 2) {
      show('Ingresá un nombre para el mazo', 'error');
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
        const deck = await flashcardService.addDeck(subjectId, { name, difficulty, generated: true });
        const generated = flashcardService.generateMockCards(selectedTopics, count);
        await flashcardService.addCardsBulk(deck.id, generated);
        show('Mazo generado', 'success');
        router.back();
      } finally {
        setSaving(false);
      }
    } else {
      if (manualCards.length === 0) {
        show('Agregá al menos una tarjeta', 'error');
        return;
      }
      setSaving(true);
      try {
        const deck = await flashcardService.addDeck(subjectId, { name, difficulty, generated: false });
        await flashcardService.addCardsBulk(deck.id, manualCards);
        show('Mazo creado', 'success');
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

      <Text style={styles.title}>Nuevo mazo</Text>

      <Input label="Nombre del mazo" placeholder="Ej. Redes — Repaso general" value={name} onChangeText={setName} leftIcon="albums-outline" containerStyle={styles.field} />

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
              <Text style={styles.emptyHint}>Esta materia todavía no tiene contenidos para generar tarjetas.</Text>
            ) : (
              <View style={styles.topicList}>
                {topics.map((topic) => {
                  const isSelected = selectedTopicIds.includes(topic.id);
                  return (
                    <Pressable key={topic.id} onPress={() => toggleTopic(topic.id)} style={styles.topicRow}>
                      <Text style={styles.topicLabel} numberOfLines={1}>{topic.title}</Text>
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Icon name="checkmark" size={13} color={colors.textPrimary} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Cantidad</Text>
            <View style={styles.chipRow}>
              {COUNT_OPTIONS.map((option) => (
                <Chip key={option} label={`${option}`} selected={count === option} onPress={() => setCount(option)} />
              ))}
            </View>
          </View>

          <Button label="Generar mazo (mock)" size="lg" fullWidth loading={saving} onPress={handleSave} style={styles.saveButton} />
        </>
      ) : (
        <>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nueva tarjeta</Text>
            <Input label="Pregunta" placeholder="Ej. ¿Qué es la herencia?" value={manualQuestion} onChangeText={setManualQuestion} containerStyle={styles.manualInput} />
            <Input label="Respuesta" placeholder="Ej. Es un mecanismo de POO..." value={manualAnswer} onChangeText={setManualAnswer} containerStyle={styles.manualInput} />
            <Button label="Agregar tarjeta" variant="secondary" icon="add" fullWidth onPress={handleAddManualCard} />
          </View>

          {manualCards.length > 0 && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{manualCards.length} {manualCards.length === 1 ? 'tarjeta agregada' : 'tarjetas agregadas'}</Text>
              <View style={styles.manualList}>
                {manualCards.map((card, index) => (
                  <View key={index} style={styles.manualCardRow}>
                    <Text style={styles.manualCardText} numberOfLines={1}>{card.question}</Text>
                    <Pressable hitSlop={8} onPress={() => removeManualCard(index)}>
                      <Icon name="close" size={16} color={colors.textTertiary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Button label="Crear mazo" size="lg" fullWidth loading={saving} onPress={handleSave} style={styles.saveButton} />
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
  manualList: {
    gap: spacing.xs,
  },
  manualCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  manualCardText: {
    ...typography.subheadline,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  saveButton: {
    marginBottom: spacing.xl,
  },
});
