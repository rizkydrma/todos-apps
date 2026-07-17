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
  /** Wrap with KeyboardAvoidingView */
  keyboard?: boolean;
  /** Use ScrollView as content container */
  scroll?: boolean;
  /** Dismiss keyboard when tapping outside inputs */
  dismissKeyboardOnPress?: boolean;
  /** Apply top/right/bottom/left safe area padding */
  safe?:
    | boolean
    | { top?: boolean; bottom?: boolean; left?: boolean; right?: boolean };
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

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
