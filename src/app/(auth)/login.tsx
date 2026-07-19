/**
 * Screen login: email/password + Google Sign-In (quiet Apple auth).
 *
 * - Zod + react-hook-form (mode onChange)
 * - Lucide leading icons; GoogleLogo resmi pada CTA Google
 * - AuthEntrance stagger mount micro-motion
 * - Setelah sukses: navigasi ke /(main)/(tabs)/todos
 */
import {
  AuthEntrance,
  Button,
  GoogleLogo,
  Screen,
  TextButton,
  TextField,
  ThemeToggle,
} from '@/components/ui';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/context/ThemeContext';
import { useEmailLogin } from '@/features/auth/hooks/useEmailLogin';
import { useGoogleSignIn } from '@/features/auth/hooks/useGoogleSignIn';
import { spacing } from '@/theme/tokens';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, TextInput, View } from 'react-native';
import * as z from 'zod';

/** Schema validasi form login. */
const loginSchema = z.object({
  email: z.email('Format email tidak valid').min(1, 'Email tidak boleh kosong'),
  password: z.string().min(6, 'Paswword terlalu pendek'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const passwordInputRef = useRef<TextInput>(null);

  const emailLogin = useEmailLogin();
  const googleSignIn = useGoogleSignIn();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const onSubmit = (data: LoginFormValues) => {
    emailLogin.mutate({ email: data.email, password: data.password });
  };

  const iconColor = theme.colors.secondaryLabel;

  return (
    <Screen keyboard dismissKeyboardOnPress safe={{ top: true }}>
      <View style={styles.content}>
        {/* Chip sun/moon — icon variant; tidak pakai link teks "Dark" yang terlihat murah */}
        <View style={styles.themeToggle}>
          <ThemeToggle variant="icon" />
        </View>

        <AuthEntrance delayMs={0}>
          <View style={styles.logoContainer}>
            <AppText variant="title">Just Todos</AppText>
            <AppText
              variant="subtitle"
              color="secondaryLabel"
              style={styles.subtitle}
            >
              Silahkan masuk ke akun Anda
            </AppText>
          </View>
        </AuthEntrance>

        <AuthEntrance delayMs={80}>
          <View style={styles.form}>
            <TextField
              control={control}
              name="email"
              placeholder="Email"
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              submitBehavior="submit"
              leftIcon={<Mail size={20} color={iconColor} strokeWidth={2} />}
            />

            <TextField
              innerRef={passwordInputRef}
              control={control}
              name="password"
              placeholder="Password"
              error={errors.password?.message}
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={handleSubmit(onSubmit)}
              leftIcon={<Lock size={20} color={iconColor} strokeWidth={2} />}
            />

            <Button
              title="Sign In"
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || emailLogin.isPending}
              loading={emailLogin.isPending}
              style={styles.submit}
            />

            <View style={styles.dividerRow}>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: theme.colors.separator },
                ]}
              />
              <AppText variant="caption" color="secondaryLabel">
                or
              </AppText>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: theme.colors.separator },
                ]}
              />
            </View>

            <Button
              title="Sign in with Google"
              variant="gray"
              leftIcon={<GoogleLogo size={18} />}
              onPress={() => googleSignIn.mutate()}
              disabled={googleSignIn.isPending || emailLogin.isPending}
              loading={googleSignIn.isPending}
              style={styles.signInGoogle}
            />

            <TextButton
              title="Belum punya akun? Daftar di sini"
              onPress={() => router.push('/(auth)/register')}
            />
          </View>
        </AuthEntrance>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  themeToggle: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  form: {
    width: '100%',
  },
  submit: {
    marginTop: spacing.lg,
    width: '100%',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  signInGoogle: {
    marginTop: spacing.md,
  },
});
