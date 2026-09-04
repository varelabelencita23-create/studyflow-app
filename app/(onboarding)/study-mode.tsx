import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { StudyMode } from '@/types';
import { useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';

const MODE_INFO: Record<StudyMode, { title: string; description: string; icon: 'flash-outline' | 'layers-outline' | 'options-outline'; subjectCount: number | null }> = {
  standard: {
    title: 'Estándar',
    description: 'Enfocate en 3 materias por semana.',
    icon: 'flash-outline',
    subjectCount: 3,
  },
  deep: {
    title: 'Profundo',
    description: 'Concentrate en 2 materias por semana.',
    icon: 'layers-outline',
    subjectCount: 2,
  },
  free: {
    title: 'Libre',
    description: 'Elegí vos cuántas materias trabajar por semana.',
    icon: 'options-outline',
    subjectCount: null,
  },
};

export default function StudyModeScreen() {
  const router = useRouter();
  const { subjects, studyModeConfig, setStudyModeConfig } = useAppState();

  const totalSubjects = Math.max(subjects.length, 1);
  const [mode, setMode] = useState<StudyMode>(studyModeConfig.studyMode);
  const [freeCount, setFreeCount] = useState(
    Math.min(studyModeConfig.maxSubjectsPerWeek || 1, totalSubjects),
  );

  const handleSelectMode = (nextMode: StudyMode) => {
    setMode(nextMode);
    if (nextMode !== 'free') {
      setFreeCount(Math.min(MODE_INFO[nextMode].subjectCount ?? totalSubjects, totalSubjects));
    }
  };

  const adjustFreeCount = (delta: 1 | -1) => {
    setFreeCount((current) => Math.min(totalSubjects, Math.max(1, current + delta)));
  };

  const handleContinue = async () => {
    const maxSubjectsPerWeek =
      mode === 'free' ? freeCount : Math.min(MODE_INFO[mode].subjectCount ?? totalSubjects, totalSubjects);
    await setStudyModeConfig({ studyMode: mode, maxSubjectsPerWeek });
    router.push('/complete');
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Modalidad de estudio</Text>
        <Text style={styles.subtitle}>
          Elegí cuántas materias querés trabajar en simultáneo cada semana. Vas a poder
          cambiarlo cuando quieras.
        </Text>
      </View>

      <View style={styles.options}>
        {(Object.keys(MODE_INFO) as StudyMode[]).map((key) => {
          const info = MODE_INFO[key];
          return (
            <SelectableCard
              key={key}
              title={info.title}
              description={
                key === 'standard' || key === 'deep'
                  ? info.description
                  : `${info.description}${subjects.length ? ` (hasta ${totalSubjects})` : ''}`
              }
              icon={info.icon}
              selected={mode === key}
              onPress={() => handleSelectMode(key)}
            >
              {key === 'free' && mode === 'free' && (
                <View style={styles.stepper}>
                  <Pressable
                    hitSlop={8}
                    disabled={freeCount <= 1}
                    onPress={() => adjustFreeCount(-1)}
                    style={styles.stepperButton}
                  >
                    <Icon
                      name="remove-circle-outline"
                      size={26}
                      color={freeCount <= 1 ? colors.textTertiary : colors.accent}
                    />
                  </Pressable>
                  <Text style={styles.stepperValue}>{freeCount} {freeCount === 1 ? 'materia' : 'materias'}</Text>
                  <Pressable
                    hitSlop={8}
                    disabled={freeCount >= totalSubjects}
                    onPress={() => adjustFreeCount(1)}
                    style={styles.stepperButton}
                  >
                    <Icon
                      name="add-circle-outline"
                      size={26}
                      color={freeCount >= totalSubjects ? colors.textTertiary : colors.accent}
                    />
                  </Pressable>
                </View>
              )}
            </SelectableCard>
          );
        })}
      </View>

      <Button label="Continuar" size="lg" fullWidth onPress={handleContinue} style={styles.continueButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
    gap: spacing.xs,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  options: {
    gap: spacing.md,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
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
  continueButton: {
    marginTop: spacing.xxxl,
  },
});
