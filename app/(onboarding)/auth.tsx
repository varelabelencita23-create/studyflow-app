import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { useToast } from '@/hooks/useToast';
import { useAppState } from '@/store';
import { colors, spacing, typography } from '@/theme';
import { isValidEmail, isValidPassword } from '@/utils';

type AuthMode = 'login' | 'register';

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { login, register } = useAppState();
  const { show } = useToast();

  const [mode, setMode] = useState<AuthMode>(params.mode === 'login' ? 'login' : 'register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      show('Ingresá un email válido', 'error');
      return;
    }
    if (!isValidPassword(password)) {
      show('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    if (mode === 'register' && fullName.trim().length < 2) {
      show('Ingresá tu nombre', 'error');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        await register(fullName, email, password);
      } else {
        await login(email, password);
      }
      router.push('/subjects');
    } catch (error) {
      show(error instanceof Error ? error.message : 'Algo salió mal', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.select({ ios: 'padding', default: undefined })}
    >
      <Screen scroll edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable hitSlop={12} onPress={() => router.back()} style={styles.backButton}>
            <Icon name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <Text style={styles.title}>{mode === 'register' ? 'Creá tu cuenta' : 'Iniciá sesión'}</Text>
        <Text style={styles.subtitle}>
          {mode === 'register'
            ? 'Empecemos a organizar tu cuatrimestre.'
            : 'Nos alegra verte de nuevo.'}
        </Text>

        <SegmentedTabs
          options={[
            { label: 'Registro', value: 'register' },
            { label: 'Iniciar sesión', value: 'login' },
          ]}
          value={mode}
          onChange={(value) => setMode(value as AuthMode)}
        />

        <View style={styles.form}>
          {mode === 'register' && (
            <Input
              label="Nombre completo"
              placeholder="Tu nombre"
              autoCapitalize="words"
              value={fullName}
              onChangeText={setFullName}
              leftIcon="person-outline"
            />
          )}
          <Input
            label="Email"
            placeholder="tu@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            leftIcon="mail-outline"
          />
          <Input
            label="Contraseña"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            leftIcon="lock-closed-outline"
          />

          {mode === 'login' && (
            <Pressable onPress={() => router.push('/forgot-password')} style={styles.forgotLink}>
              <Text style={styles.forgotLinkText}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          )}

          <Button
            label={mode === 'register' ? 'Crear cuenta' : 'Iniciar sesión'}
            fullWidth
            size="lg"
            loading={loading}
            onPress={handleSubmit}
            style={styles.submitButton}
          />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  },
  subtitle: {
    ...typography.subheadline,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    marginBottom: spacing.xxl,
  },
  form: {
    gap: spacing.lg,
    marginTop: spacing.xxl,
  },
  forgotLink: {
    alignSelf: 'flex-end',
  },
  forgotLinkText: {
    ...typography.subheadline,
    color: colors.accent,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
});
