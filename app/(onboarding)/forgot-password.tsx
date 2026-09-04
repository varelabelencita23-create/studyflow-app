import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/hooks/useToast';
import { useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { isValidEmail } from '@/utils';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { sendPasswordReset } = useAppState();
  const { show } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      show('Ingresá un email válido', 'error');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (error) {
      show(error instanceof Error ? error.message : 'Algo salió mal', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }} />
        <Pressable hitSlop={12} onPress={() => router.back()} style={styles.closeButton}>
          <Icon name="close" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      {sent ? (
        <View style={styles.successState}>
          <View style={styles.successIcon}>
            <Icon name="checkmark-circle" size={40} color={colors.success} />
          </View>
          <Text style={[styles.title, styles.textCenter]}>Revisá tu email</Text>
          <Text style={[styles.subtitle, styles.textCenter]}>
            Te enviamos instrucciones para recuperar tu contraseña a {email}.
          </Text>
          <Button
            label="Volver a iniciar sesión"
            variant="secondary"
            fullWidth
            onPress={() => router.replace('/auth?mode=login')}
            style={styles.backToLogin}
          />
        </View>
      ) : (
        <>
          <Text style={styles.title}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>
            Ingresá el email de tu cuenta y te mandamos instrucciones para restablecerla.
          </Text>
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="tu@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              leftIcon="mail-outline"
            />
            <Button label="Enviar instrucciones" fullWidth size="lg" loading={loading} onPress={handleSubmit} />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.title1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.subheadline,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.lg,
    marginTop: spacing.xxl,
  },
  successState: {
    alignItems: 'center',
    paddingTop: spacing.huge,
    gap: spacing.sm,
  },
  textCenter: {
    textAlign: 'center',
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xxl,
    backgroundColor: colors.successSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  backToLogin: {
    marginTop: spacing.xxl,
    width: '100%',
  },
});
