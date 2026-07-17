/**
 * Input form dengan floating label (gaya X) + integrasi react-hook-form.
 *
 * - Controller RHF: name + control mengikat value/onChange/onBlur
 * - Label mengambang saat focus atau ada isi
 * - Border/label merah kalau ada error
 * - TextFieldShell: isolasi animasi float agar render Controller tetap "bersih"
 */
import { useAppTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useEffect, useRef, useState } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import {
  Animated,
  TextInput,
  type StyleProp,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';
import { AppText } from './AppText';

/** Tinggi field + posisi/ukuran label saat rest vs float. */
const FIELD_HEIGHT = 56;
const LABEL_REST_TOP = 18;
const LABEL_FLOAT_TOP = 8;
const LABEL_REST_SIZE = 16;
const LABEL_FLOAT_SIZE = 13;

export type TextFieldProps<T extends FieldValues> = Omit<
  TextInputProps,
  'style' | 'placeholder'
> & {
  control: Control<T>;
  name: Path<T>;
  /** Teks floating label. Default: placeholder. */
  label?: string;
  /** Dipakai sebagai label jika `label` tidak diisi. */
  placeholder?: string;
  /** Pesan error di bawah field (dari formState.errors). */
  error?: string;
  /** Ref ke TextInput (untuk focus berantai antar field). */
  innerRef?: React.RefObject<TextInput | null>;
};

/** True jika value form dianggap "ada isi" (label harus float). */
function hasFieldValue(value: unknown): boolean {
  if (value == null) return false;
  return String(value).length > 0;
}

/**
 * Field terikat react-hook-form.
 * Props TextInput lain (secureTextEntry, keyboardType, …) diteruskan lewat rest.
 */
export function TextField<T extends FieldValues>({
  control,
  name,
  error,
  innerRef,
  label,
  placeholder,
  onFocus,
  onBlur: onBlurProp,
  ...restProps
}: TextFieldProps<T>) {
  const { theme } = useAppTheme();
  const [focused, setFocused] = useState(false);
  // 0 = label di tengah (rest), 1 = label naik kecil (float)
  const [floatAnim] = useState(() => new Animated.Value(0));
  const labelText = label ?? placeholder;

  const styles = useThemedStyles((t) => ({
    container: {
      width: '100%' as const,
      marginTop: t.spacing.md,
    },
    field: {
      minHeight: FIELD_HEIGHT,
      borderWidth: 1,
      borderRadius: t.radius.sm,
      paddingHorizontal: t.spacing.md,
      justifyContent: 'center' as const,
    },
    input: {
      fontSize: t.fontSize.md,
      // Ruang di atas untuk label float
      paddingTop: 22,
      paddingBottom: 8,
      paddingHorizontal: 0,
      margin: 0,
      minHeight: FIELD_HEIGHT - 2,
    },
    errorText: {
      marginTop: t.spacing.xs,
      marginLeft: t.spacing.xs,
    },
  }));

  // Border: error > focus > default
  const borderColor = error
    ? theme.colors.error
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  const labelColor = error
    ? theme.colors.error
    : focused
      ? theme.colors.primary
      : theme.colors.textMuted;

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur: onFieldBlur, value } }) => {
          // Float jika focus ATAU sudah ada nilai
          const floated = focused || hasFieldValue(value);

          return (
            <TextFieldShell
              floatAnim={floatAnim}
              floated={floated}
              labelText={labelText}
              labelColor={labelColor}
              fieldStyle={[
                styles.field,
                {
                  backgroundColor: theme.colors.background,
                  borderColor,
                },
              ]}
              labelLeft={theme.spacing.md}
            >
              <TextInput
                ref={innerRef}
                value={value == null ? '' : String(value)}
                onChangeText={onChange}
                accessibilityLabel={labelText}
                {...restProps}
                onFocus={(e) => {
                  setFocused(true);
                  onFocus?.(e);
                }}
                onBlur={(e) => {
                  setFocused(false);
                  onFieldBlur(); // beritahu RHF field touched
                  onBlurProp?.(e);
                }}
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                  },
                ]}
              />
            </TextFieldShell>
          );
        }}
      />

      {error ? (
        <AppText variant="caption" color="error" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

type TextFieldShellProps = {
  floatAnim: Animated.Value;
  floated: boolean;
  labelText?: string;
  labelColor: string;
  labelLeft: number;
  fieldStyle: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

/**
 * Isolasi side-effect animasi float.
 * Dipisah dari render Controller supaya tidak campur logic animasi di callback RHF.
 */
function TextFieldShell({
  floatAnim,
  floated,
  labelText,
  labelColor,
  labelLeft,
  fieldStyle,
  children,
}: TextFieldShellProps) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip animasi di mount: pre-filled value langsung float tanpa "flash"
    if (isFirstRender.current) {
      isFirstRender.current = false;
      floatAnim.setValue(floated ? 1 : 0);
      return;
    }

    Animated.timing(floatAnim, {
      toValue: floated ? 1 : 0,
      duration: 150,
      useNativeDriver: false, // fontSize/top tidak didukung native driver
    }).start();
  }, [floated, floatAnim]);

  return (
    <View style={fieldStyle}>
      {labelText ? (
        <Animated.Text
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: labelLeft,
            top: floatAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [LABEL_REST_TOP, LABEL_FLOAT_TOP],
            }),
            fontSize: floatAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [LABEL_REST_SIZE, LABEL_FLOAT_SIZE],
            }),
            color: labelColor,
            zIndex: 1,
          }}
        >
          {labelText}
        </Animated.Text>
      ) : null}
      {children}
    </View>
  );
}
