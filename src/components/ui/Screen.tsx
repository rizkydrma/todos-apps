/**
 * Layout layar standar: background tema + opsi keyboard / scroll / safe area.
 *
 * Props penting:
 * - keyboard: KeyboardAvoidingView (iOS padding)
 * - scroll: ScrollView untuk form panjang
 * - dismissKeyboardOnPress: tap di luar input menutup keyboard
 * - safe: padding notch/home indicator (bool atau per-sisi)
 *
 * Dipakai di login/register supaya layout form konsisten.
 */
import { useAppTheme } from '@/context/ThemeContext';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ScreenProps = {
  children: React.ReactNode;
  /** Bungkus dengan KeyboardAvoidingView. */
  keyboard?: boolean;
  /** Konten di dalam ScrollView. */
  scroll?: boolean;
  /** Tap di luar input → Keyboard.dismiss(). */
  dismissKeyboardOnPress?: boolean;
  /** Padding safe area: true = semua sisi, atau object pilih sisi. */
  safe?:
    | boolean
    | { top?: boolean; bottom?: boolean; left?: boolean; right?: boolean };
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Susun tree: root (View/KAV) → optional dismiss → ScrollView/View → children.
 */
export function Screen({
  children,
  keyboard = false,
  scroll = false,
  dismissKeyboardOnPress = false,
  safe = false,
  style,
  contentStyle,
}: ScreenProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  // Normalisasi prop safe → config booleans per sisi
  const safeConfig =
    safe === true
      ? { top: true, bottom: true, left: true, right: true }
      : safe === false
        ? { top: false, bottom: false, left: false, right: false }
        : {
            top: Boolean(safe.top),
            bottom: Boolean(safe.bottom),
            left: Boolean(safe.left),
            right: Boolean(safe.right),
          };

  const safePadding: ViewStyle = {
    paddingTop: safeConfig.top ? insets.top : undefined,
    paddingBottom: safeConfig.bottom ? insets.bottom : undefined,
    paddingLeft: safeConfig.left ? insets.left : undefined,
    paddingRight: safeConfig.right ? insets.right : undefined,
  };

  // Konten: scrollable atau View biasa
  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      style={styles.flex}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentStyle]}>{children}</View>
  );

  // Opsional: tap di luar field menutup keyboard
  const body = dismissKeyboardOnPress ? (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {content}
    </TouchableWithoutFeedback>
  ) : (
    content
  );

  const rootStyle = [
    styles.flex,
    { backgroundColor: theme.colors.background },
    safePadding,
    style,
  ];

  if (keyboard) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={rootStyle}
      >
        {body}
      </KeyboardAvoidingView>
    );
  }

  return <View style={rootStyle}>{body}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },
});
