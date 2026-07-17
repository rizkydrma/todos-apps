import { Button, Screen, TextButton, TextField } from '@/components/ui';
import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/theme/tokens';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
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
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

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
    console.log(`Register berhasil`, data);
  };

  return (
    <Screen
      keyboard
      scroll
      dismissKeyboardOnPress
      safe={{ top: true, bottom: true }}
      contentStyle={styles.content}
    >
      <View style={styles.logoContainer}>
        <AppText variant="title">Buat Akun</AppText>
        <AppText variant="subtitle" color="textMuted" style={styles.subtitle}>
          Gabung bersama sekarang
        </AppText>
      </View>

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
        />

        <Button
          title="Daftar Sekarang"
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid}
          style={styles.submit}
        />

        <TextButton
          title="Sudah punya akun? Login disini"
          onPress={() => router.back()}
        />
      </View>
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
