/**
 * Screen registrasi akun baru (quiet Apple auth).
 *
 * - Zod: name, email, password min 6, confirmPassword cocok
 * - Lucide icons + AuthEntrance micro-motion
 * - useRegister → verify-email (belum ada session)
 */
import {
  AuthEntrance,
  Button,
  Screen,
  TextButton,
  TextField,
} from '@/components/ui';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/context/ThemeContext';
import { useRegister } from '@/features/auth/hooks/useRegister';
import { spacing } from '@/theme/tokens';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Lock, Mail, User } from 'lucide-react-native';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, TextInput, View } from 'react-native';
import z from 'zod';

const registerSchema = z
  .object({
    name: z.string().min(1, 'Nama tidak boleh kosong'),
    email: z.email('Format email salah'),
    password: z.string().min(6, 'Minimal 6 karakter'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const register = useRegister();
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const iconColor = theme.colors.secondaryLabel;

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const onSubmit = (data: RegisterFormValues) => {
    register.mutate({
      name: data.name,
      email: data.email,
      password: data.password,
    });
  };

  return (
    <Screen
      keyboard
      scroll
      dismissKeyboardOnPress
      safe={{ top: true, bottom: true }}
      contentStyle={styles.content}
    >
      <AuthEntrance delayMs={0}>
        <View style={styles.logoContainer}>
          <AppText variant="title">Buat Akun</AppText>
          <AppText
            variant="subtitle"
            color="secondaryLabel"
            style={styles.subtitle}
          >
            Gabung bersama sekarang
          </AppText>
        </View>
      </AuthEntrance>

      <AuthEntrance delayMs={80}>
        <View>
          <TextField
            control={control}
            name="name"
            placeholder="Nama Lengkap"
            returnKeyType="next"
            autoCapitalize="words"
            error={errors.name?.message}
            submitBehavior="submit"
            onSubmitEditing={() => emailInputRef.current?.focus()}
            leftIcon={<User size={20} color={iconColor} strokeWidth={2} />}
          />

          <TextField
            innerRef={emailInputRef}
            control={control}
            name="email"
            placeholder="Email"
            error={errors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            leftIcon={<Mail size={20} color={iconColor} strokeWidth={2} />}
          />

          <TextField
            innerRef={passwordInputRef}
            control={control}
            name="password"
            placeholder="Password"
            error={errors.password?.message}
            secureTextEntry
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
            leftIcon={<Lock size={20} color={iconColor} strokeWidth={2} />}
          />

          <TextField
            innerRef={confirmPasswordInputRef}
            control={control}
            name="confirmPassword"
            placeholder="Konfirmasi Password"
            error={errors.confirmPassword?.message}
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={handleSubmit(onSubmit)}
            leftIcon={<Lock size={20} color={iconColor} strokeWidth={2} />}
          />

          <Button
            title="Daftar Sekarang"
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || register.isPending}
            loading={register.isPending}
            style={styles.submit}
          />

          <TextButton
            title="Sudah punya akun? Login disini"
            onPress={() => router.back()}
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
  logoContainer: {
    alignItems: 'center' as const,
    marginBottom: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.sm,
    textAlign: 'center' as const,
  },
  submit: {
    marginTop: spacing.lg,
    width: '100%' as const,
  },
});
