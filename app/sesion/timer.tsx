import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Button, Icon, ModalDialog, ProgressBar } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { contentService } from '@/services';
import { getElapsedMs, useActiveSession } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { formatClock } from '@/utils';

export default function SessionTimerScreen() {
  const router = useRouter();
  const { activeSession, pause, resume, discardSession } = useActiveSession();
  const [, setTick] = useState(0);
  const [contentTitles, setContentTitles] = useState<string[]>([]);
  const [cancelVisible, setCancelVisible] = useState(false);

  // Guards a direct/deep-link entry with no active session. Runs once on
  // mount only — discardSession()/finalize() clearing activeSession later
  // must not re-trigger this (their callers already navigate explicitly).
  useEffect(() => {
    if (!activeSession) {
      router.replace('/(tabs)');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeSession?.isRunning) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [activeSession?.isRunning]);

  useEffect(() => {
    if (!activeSession) return;
    (async () => {
      const topics = await contentService.listBySubject(activeSession.subjectId);
      setContentTitles(
        topics.filter((topic) => activeSession.contentIds.includes(topic.id)).map((topic) => topic.title),
      );
    })();
  }, [activeSession?.subjectId]);

  if (!activeSession) return null;

  const elapsedSeconds = Math.floor(getElapsedMs(activeSession) / 1000);
  const goalSeconds = activeSession.goalMinutes ? activeSession.goalMinutes * 60 : null;

  const handleTogglePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (activeSession.isRunning) pause();
    else resume();
  };

  const handleDiscard = () => {
    setCancelVisible(false);
    discardSession();
    router.replace(`/materia/${activeSession.subjectId}`);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.subjectName}>{activeSession.subjectName}</Text>
        {contentTitles.length > 0 && (
          <Text style={styles.contentSummary} numberOfLines={2}>
            {contentTitles.join(' · ')}
          </Text>
        )}
      </View>

      <View style={styles.timerBlock}>
        <Text style={styles.timer}>{formatClock(elapsedSeconds)}</Text>
        <Text style={styles.status}>{activeSession.isRunning ? 'En curso' : 'En pausa'}</Text>

        {goalSeconds && (
          <ProgressBar
            progress={elapsedSeconds / goalSeconds}
            label={`Objetivo: ${activeSession.goalMinutes} min`}
            showLabel
            style={styles.goalProgress}
          />
        )}
      </View>

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          onPress={handleTogglePause}
          style={[styles.playButton, !activeSession.isRunning && styles.playButtonPaused]}
        >
          <Icon name={activeSession.isRunning ? 'pause' : 'play'} size={32} color="#FFFFFF" />
        </Pressable>

        <Button label="Finalizar sesión" size="lg" fullWidth onPress={() => router.replace('/sesion/resumen')} />
        <Button label="Cancelar sesión" variant="ghost" fullWidth onPress={() => setCancelVisible(true)} />
      </View>

      <ModalDialog
        visible={cancelVisible}
        onRequestClose={() => setCancelVisible(false)}
        title="¿Descartar esta sesión?"
        description="Se perderá el tiempo registrado y no se guardará nada."
        actions={[
          { label: 'Seguir estudiando', onPress: () => setCancelVisible(false), variant: 'secondary' },
          { label: 'Descartar', onPress: handleDiscard, variant: 'destructive' },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  subjectName: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  contentSummary: {
    ...typography.footnote,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
  },
  timerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  timer: {
    fontFamily: typography.largeTitle.fontFamily,
    fontSize: 64,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  status: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  goalProgress: {
    width: '80%',
    marginTop: spacing.xl,
  },
  controls: {
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  playButton: {
    width: 84,
    height: 84,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  playButtonPaused: {
    backgroundColor: colors.success,
  },
});
