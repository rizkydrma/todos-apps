/**
 * Input OTP 6 digit: 6 kotak visual + satu TextInput tersembunyi.
 *
 * - Satu TextInput di belakang cell → paste & SMS autofill (oneTimeCode) reliable
 * - Hanya digit; non-digit di-strip
 * - Integrasi react-hook-form (control + name) seperti TextField
 * - Border: error > focus active cell > default
 */
import { useAppTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRef, useState } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import {
  Pressable,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { AppText } from './AppText';

const DEFAULT_LENGTH = 6;

export type OtpInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  /** Jumlah digit. Default 6. */
  length?: number;
  /** Pesan error di bawah row (dari formState.errors). */
  error?: string;
  /** Label aksesibilitas untuk input tersembunyi. */
  accessibilityLabel?: string;
  /** Dipanggil saat user tekan return di keyboard (jika ada). */
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  /** Auto-focus saat mount. Default true. */
  autoFocus?: boolean;
};

/** Strip non-digit dan potong ke `length`. */
function sanitizeDigits(raw: string, length: number): string {
  return raw.replace(/\D/g, '').slice(0, length);
}

/**
 * Field OTP terikat react-hook-form.
 * Value form = string digit (mis. "123456"), max `length` karakter.
 */
export function OtpInput<T extends FieldValues>({
  control,
  name,
  length = DEFAULT_LENGTH,
  error,
  accessibilityLabel = 'Kode verifikasi',
  onSubmitEditing,
  autoFocus = true,
}: OtpInputProps<T>) {
  const { theme } = useAppTheme();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const styles = useThemedStyles((t) => ({
    container: {
      width: '100%' as const,
      marginTop: t.spacing.md,
    },
    row: {
      position: 'relative' as const,
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      gap: t.spacing.sm,
    },
    cell: {
      flex: 1,
      maxWidth: 52,
      aspectRatio: 1,
      borderWidth: 1.5,
      borderRadius: t.radius.sm,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    cellDigit: {
      fontSize: t.fontSize.xl,
      fontWeight: t.fontWeight.semibold,
      lineHeight: t.fontSize.xl + 4,
      textAlign: 'center' as const,
    },
    caret: {
      width: 2,
      height: t.fontSize.xl,
      borderRadius: 1,
    },
    // Full-size transparan di atas row — tangkap ketikan & paste
    hiddenInput: {
      position: 'absolute' as const,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      opacity: 0.02,
      color: 'transparent',
    },
    errorText: {
      marginTop: t.spacing.xs,
      textAlign: 'center' as const,
    },
  }));

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => {
          const code = sanitizeDigits(
            value == null ? '' : String(value),
            length
          );
          // Cell aktif = digit berikutnya (atau terakhir jika sudah penuh)
          const activeIndex = Math.min(code.length, length - 1);

          const focusInput = () => {
            inputRef.current?.focus();
          };

          return (
            <Pressable
              onPress={focusInput}
              accessibilityRole="none"
              style={styles.row}
            >
              {Array.from({ length }, (_, i) => {
                const digit = code[i] ?? '';
                const isActive = focused && i === activeIndex;
                const borderColor = error
                  ? theme.colors.destructive
                  : isActive
                    ? theme.colors.primary
                    : theme.colors.separator;

                return (
                  <View
                    key={i}
                    style={[
                      styles.cell,
                      {
                        borderColor,
                        backgroundColor: theme.colors.tertiarySystemFill,
                      },
                    ]}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    {digit ? (
                      <Text
                        style={[
                          styles.cellDigit,
                          { color: theme.colors.label },
                        ]}
                      >
                        {digit}
                      </Text>
                    ) : isActive ? (
                      <View
                        style={[
                          styles.caret,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      />
                    ) : null}
                  </View>
                );
              })}

              <TextInput
                ref={inputRef}
                value={code}
                onChangeText={(text) => {
                  onChange(sanitizeDigits(text, length));
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  setFocused(false);
                  onBlur();
                }}
                style={styles.hiddenInput}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                autoFocus={autoFocus}
                caretHidden
                maxLength={length}
                importantForAutofill="yes"
                accessibilityLabel={accessibilityLabel}
                returnKeyType="done"
                onSubmitEditing={onSubmitEditing}
              />
            </Pressable>
          );
        }}
      />

      {error ? (
        <AppText variant="caption" color="destructive" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
