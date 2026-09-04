import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { Button, ButtonVariant } from './Button';

interface ModalAction {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
}

interface ModalDialogProps {
  visible: boolean;
  onRequestClose: () => void;
  title: string;
  description?: string;
  actions?: ModalAction[];
  children?: ReactNode;
}

export function ModalDialog({
  visible,
  onRequestClose,
  title,
  description,
  actions,
  children,
}: ModalDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} />
        <BlurView intensity={40} tint="dark" style={styles.blurBackdrop} pointerEvents="none" />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
          {children}
          {actions && actions.length > 0 && (
            <View style={styles.actions}>
              {actions.map((action) => (
                <Button
                  key={action.label}
                  label={action.label}
                  onPress={action.onPress}
                  variant={action.variant ?? 'secondary'}
                  fullWidth
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  blurBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    ...typography.title3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    ...typography.subheadline,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
