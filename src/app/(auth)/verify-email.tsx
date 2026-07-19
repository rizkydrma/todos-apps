/**
 * Screen verifikasi email via OTP 6 digit (quiet Apple auth).
 *
 * Params: email (dari register success atau login EMAIL_NOT_VERIFIED).
 * AuthEntrance micro-motion; Lucide Mail hint di header.
 */
import {
  AuthEntrance,
  Button,
  OtpInput,
  Screen,
  TextButton,
} from '@/components/ui';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/context/ThemeContext';
import { authCopy } from '@/features/auth/auth-copy';
import { useResendVerification } from '@/features/auth/hooks/useResendVerification';
import { useVerifyEmail } from '@/features/auth/hooks/useVerifyEmail';
import { spacing } from '@/theme/tokens';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import z from 'zod';

const RESEND_COOLDOWN_SECONDS = 60;

const verifySchema = z.object({
  code: z
    .string()
    .min(1, authCopy.verify.codeRequired)
    .regex(/^\d{6}$/, authCopy.verify.codeInvalid),
});

type VerifyFormValues = z.infer<typeof verifySchema>;

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = useMemo(
    () => firstParam(params.email).trim().toLowerCase(),
    [params.email]
  );

  const verifyEmail = useVerifyEmail();
  const resend = useResendVerification();
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: '' },
    mode: 'onChange',
  });

  const onSubmit = (data: VerifyFormValues) => {
    if (!email) return;
    verifyEmail.mutate({ email, code: data.code });
  };

  const onResend = useCallback(() => {
    if (!email || cooldown > 0 || resend.isPending) return;
    resend.mutate(
      { email },
      {
        onSuccess: () => {
          setCooldown(RESEND_COOLDOWN_SECONDS);
        },
      }
    );
  }, [email, cooldown, resend]);

  if (!email) {
    return (
      <Screen safe={{ top: true, bottom: true }} contentStyle={styles.content}>
        <AppText variant="title">{authCopy.verify.title}</AppText>
        <AppText variant="body" color="secondaryLabel" style={styles.subtitle}>
          {authCopy.verify.missingEmail}
        </AppText>
        <TextButton
          title={authCopy.verify.backToLogin}
          onPress={() => router.replace('/(auth)/login')}
        />
      </Screen>
    );
  }

  return (
    <Screen
      keyboard
      scroll
      dismissKeyboardOnPress
      safe={{ top: true, bottom: true }}
      contentStyle={styles.content}
    >
      <AuthEntrance delayMs={0}>
        <View style={styles.header}>
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: theme.colors.secondarySystemFill },
            ]}
          >
            <Mail size={28} color={theme.colors.primary} strokeWidth={2} />
          </View>
          <AppText variant="title">{authCopy.verify.title}</AppText>
          <AppText
            variant="subtitle"
            color="secondaryLabel"
            style={styles.subtitle}
          >
            {authCopy.verify.subtitle(email)}
          </AppText>
        </View>
      </AuthEntrance>

      <AuthEntrance delayMs={80}>
        <View>
          <OtpInput
            control={control}
            name="code"
            length={6}
            error={errors.code?.message}
            accessibilityLabel={authCopy.verify.codeLabel}
            onSubmitEditing={handleSubmit(onSubmit)}
          />

          <Button
            title={authCopy.verify.submit}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || verifyEmail.isPending}
            loading={verifyEmail.isPending}
            style={styles.submit}
          />

          <Button
            title={
              cooldown > 0
                ? authCopy.verify.resendCooldown(cooldown)
                : authCopy.verify.resend
            }
            variant="plain"
            onPress={onResend}
            disabled={cooldown > 0 || resend.isPending || verifyEmail.isPending}
            loading={resend.isPending}
            style={styles.resend}
          />

          <TextButton
            title={authCopy.verify.backToLogin}
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>
      </AuthEntrance>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center' as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  header: {
    alignItems: 'center' as const,
    marginBottom: spacing.xl,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: spacing.md,
  },
  subtitle: {
    marginTop: spacing.sm,
    textAlign: 'center' as const,
  },
  submit: {
    marginTop: spacing.lg,
    width: '100%' as const,
  },
  resend: {
    marginTop: spacing.sm,
  },
});
