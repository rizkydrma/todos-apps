/**
 * Screen login: email/password + Google Sign-In.
 *
 * - Zod + react-hook-form untuk validasi live (mode onChange)
 * - Auth guard di root Stack.Protected (screen ini hanya mount saat unauthenticated)
 * - Focus berantai: email → password → submit
 * - Setelah sukses: hook login navigasi ke /(main)/(tabs)/todos
 */
import {
  Button,
  Screen,
  TextButton,
  TextField,
  ThemeToggle,
} from '@/components/ui';
import { AppText } from '@/components/ui/AppText';
import { useEmailLogin } from '@/features/auth/hooks/useEmailLogin';
import { useGoogleSignIn } from '@/features/auth/hooks/useGoogleSignIn';
import { spacing } from '@/theme/tokens';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
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
  // Ref untuk pindah focus ke password saat user tekan "next" di email
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
    mode: 'onChange', // validasi tiap ketikan → isValid update real-time
  });

  /** Submit form → mutation login email. */
  const onSubmit = (data: LoginFormValues) => {
    emailLogin.mutate({ email: data.email, password: data.password });
  };

  return (
    <Screen keyboard dismissKeyboardOnPress safe={{ top: true }}>
      <View style={styles.content}>
        <View style={styles.themeToggle}>
          <ThemeToggle variant="text" />
        </View>

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
          />

          <Button
            title="Sign In"
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || emailLogin.isPending}
            style={styles.submit}
          />

          <Button
            title="Sign in with Google"
            onPress={() => googleSignIn.mutate()}
            disabled={googleSignIn.isPending || emailLogin.isPending}
            style={styles.signInGoogle}
          />

          <TextButton
            title="Belum punya akun? Daftar di sini"
            onPress={() => router.push('/(auth)/register')}
          />
        </View>
      </View>
    </Screen>
  );
}

/** Layout statis — spasi dari design tokens, bukan warna tema. */
const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  themeToggle: {
    position: 'absolute',
    top: spacing.sm,
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
  signInGoogle: {
    marginTop: spacing.lg,
  },
});
