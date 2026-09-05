import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Badge,
  BottomSheet,
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  Icon,
  Input,
  ModalDialog,
  ProgressBar,
  Screen,
  SegmentedTabs,
  SelectableCard,
  Skeleton,
  SkeletonCard,
  Switch,
} from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { colors, radius, spacing, typography } from '@/theme';

const COLOR_SWATCHES: { label: string; value: string }[] = [
  { label: 'background', value: colors.background },
  { label: 'surface', value: colors.surface },
  { label: 'surfaceElevated', value: colors.surfaceElevated },
  { label: 'accent', value: colors.accent },
  { label: 'textSecondary', value: colors.textSecondary },
  { label: 'success', value: colors.success },
  { label: 'warning', value: colors.warning },
  { label: 'danger', value: colors.danger },
];

const SUBJECT_CHIPS = ['Redes', 'Física', 'Programación II'];

export default function DesignSystemScreen() {
  const router = useRouter();
  const { show } = useToast();
  const [selectedChip, setSelectedChip] = useState(SUBJECT_CHIPS[0]);
  const [segment, setSegment] = useState('week');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [switchOn, setSwitchOn] = useState(true);
  const [studyMode, setStudyMode] = useState<'standard' | 'deep'>('standard');

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => router.back()} style={styles.backButton}>
          <Icon name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Design System</Text>
        <View style={styles.backButton} />
      </View>

      <Section title="Tipografía">
        <Text style={typography.largeTitle}>Large Title</Text>
        <Text style={[typography.title1, styles.dsText]}>Title 1</Text>
        <Text style={[typography.title2, styles.dsText]}>Title 2</Text>
        <Text style={[typography.headline, styles.dsText]}>Headline</Text>
        <Text style={[typography.body, styles.dsText]}>Body — el texto principal de la app.</Text>
        <Text style={[typography.subheadline, styles.dsTextSecondary]}>Subheadline secundario</Text>
        <Text style={[typography.footnote, styles.dsTextSecondary]}>Footnote / caption</Text>
      </Section>

      <Section title="Colores">
        <View style={styles.swatchGrid}>
          {COLOR_SWATCHES.map((swatch) => (
            <View key={swatch.label} style={styles.swatchItem}>
              <View style={[styles.swatch, { backgroundColor: swatch.value }]} />
              <Text style={styles.swatchLabel}>{swatch.label}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Botones">
        <View style={styles.stackGap}>
          <Button label="Primario" variant="primary" fullWidth onPress={() => show('Acción primaria', 'success')} />
          <Button label="Secundario" variant="secondary" fullWidth onPress={() => {}} />
          <Button label="Ghost" variant="ghost" fullWidth onPress={() => {}} />
          <Button label="Destructivo" variant="destructive" fullWidth onPress={() => {}} />
          <View style={styles.row}>
            <Button label="Con ícono" icon="add" size="sm" onPress={() => {}} />
            <Button label="Cargando" loading size="sm" onPress={() => {}} />
            <Button label="Deshabilitado" disabled size="sm" onPress={() => {}} />
          </View>
        </View>
      </Section>

      <Section title="Cards">
        <View style={styles.stackGap}>
          <Card variant="surface">
            <Text style={styles.cardTitle}>Card surface</Text>
            <Text style={styles.dsTextSecondary}>Uso general para contenido agrupado.</Text>
          </Card>
          <Card variant="elevated">
            <Text style={styles.cardTitle}>Card elevated</Text>
            <Text style={styles.dsTextSecondary}>Para destacar información importante.</Text>
          </Card>
          <Card variant="light">
            <Text style={styles.lightCardTitle}>REDES</Text>
            <Text style={styles.lightCardSubtitle}>Tarjeta de materia — fondo blanco</Text>
          </Card>
        </View>
      </Section>

      <Section title="Inputs">
        <Input label="Materia" placeholder="Ej. Sistemas Operativos" leftIcon="book-outline" />
        <Input label="Con error" placeholder="Contraseña" secureTextEntry error="Mínimo 8 caracteres" />
      </Section>

      <Section title="Progreso">
        <ProgressBar progress={0.72} showLabel label="Programación II" />
      </Section>

      <Section title="Chips de materia">
        <View style={styles.row}>
          {SUBJECT_CHIPS.map((label) => (
            <Chip
              key={label}
              label={label}
              selected={selectedChip === label}
              onPress={() => setSelectedChip(label)}
            />
          ))}
        </View>
      </Section>

      <Section title="Badges">
        <View style={styles.row}>
          <Badge label="Vas bien" variant="success" />
          <Badge label="Atrasada" variant="danger" />
          <Badge label="Adelantada" variant="accent" />
          <Badge label="Neutral" variant="neutral" />
        </View>
      </Section>

      <Section title="Segmented Tabs">
        <SegmentedTabs
          options={[
            { label: 'Semana', value: 'week' },
            { label: 'Mes', value: 'month' },
            { label: 'Total', value: 'total' },
          ]}
          value={segment}
          onChange={setSegment}
        />
      </Section>

      <Section title="Switch">
        <View style={styles.switchRow}>
          <Text style={styles.dsText}>Recordatorio diario</Text>
          <Switch value={switchOn} onValueChange={setSwitchOn} />
        </View>
      </Section>

      <Section title="Selectable Card">
        <View style={styles.stackGap}>
          <SelectableCard
            title="Estándar"
            description="Enfocate en 3 materias por semana."
            icon="flash-outline"
            selected={studyMode === 'standard'}
            onPress={() => setStudyMode('standard')}
          />
          <SelectableCard
            title="Profundo"
            description="Concentrate en 2 materias por semana."
            icon="layers-outline"
            selected={studyMode === 'deep'}
            onPress={() => setStudyMode('deep')}
          />
        </View>
      </Section>

      <Section title="Empty state">
        <EmptyState
          icon="sparkles-outline"
          title="Todo listo"
          description="Así se ve un estado vacío dentro de la app."
        />
      </Section>

      <Section title="Loading / Skeleton">
        <SkeletonCard />
        <Skeleton width="100%" height={14} style={{ marginTop: spacing.md }} />
        <Skeleton width="60%" height={14} style={{ marginTop: spacing.sm }} />
      </Section>

      <Section title="Feedback">
        <View style={styles.stackGap}>
          <Button label="Mostrar toast" variant="secondary" fullWidth onPress={() => show('Sesión guardada correctamente', 'success')} />
          <Button label="Abrir bottom sheet" variant="secondary" fullWidth onPress={() => setSheetVisible(true)} />
          <Button label="Abrir modal" variant="secondary" fullWidth onPress={() => setDialogVisible(true)} />
        </View>
      </Section>

      <BottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)}>
        <Text style={styles.sheetTitle}>Bottom Sheet</Text>
        <Text style={styles.dsTextSecondary}>
          Deslizá hacia abajo o tocá fuera para cerrar. Ideal para acciones rápidas.
        </Text>
        <Button label="Cerrar" onPress={() => setSheetVisible(false)} fullWidth style={{ marginTop: spacing.xl }} />
      </BottomSheet>

      <ModalDialog
        visible={dialogVisible}
        onRequestClose={() => setDialogVisible(false)}
        title="¿Eliminar materia?"
        description="Esta acción no se puede deshacer."
        actions={[
          { label: 'Cancelar', onPress: () => setDialogVisible(false), variant: 'secondary' },
          { label: 'Eliminar', onPress: () => setDialogVisible(false), variant: 'destructive' },
        ]}
      />
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Divider style={styles.sectionDivider} />
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  section: {
    marginBottom: spacing.xxxl,
  },
  sectionTitle: {
    ...typography.caption1,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionDivider: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionContent: {
    gap: spacing.md,
  },
  dsText: {
    color: colors.textPrimary,
  },
  dsTextSecondary: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  stackGap: {
    gap: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  swatchItem: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 76,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  swatchLabel: {
    ...typography.caption2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cardTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  lightCardTitle: {
    ...typography.title3,
    color: colors.onLightText,
    marginBottom: spacing.xxs,
  },
  lightCardSubtitle: {
    ...typography.footnote,
    color: colors.onLightTextSecondary,
  },
  sheetTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
});
