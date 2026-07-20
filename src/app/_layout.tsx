/**
 * Root layout Expo Router — provider tree + auth via Stack.Protected.
 *
 * Urutan provider (luar → dalam):
 * QueryProvider → SafeArea → Theme → Auth → NavigationLayout
 *
 * Auth routing (Expo Router 57 idiomatic):
 * - SELALU render <Stack> (jangan early-return tanpa navigator).
 * - Stack.Protected guard={authenticated} → (main) + index
 * - Stack.Protected guard={!authenticated} → login + register + verify
 *
 * Splash strategy (stabil, hindari race useLinking):
 * 1. Native splash (app.json): background hitam + logo di tengah (imageWidth).
 *    Bukan full-bleed PNG portrait — plugin Expo/Android 12+ memperlakukan
 *    image sebagai logo, bukan wallpaper full screen.
 * 2. Jangan preventAutoHideAsync + hide di render — itu memicu side-effect /
 *    glitch dengan deep-link state di expo-router.
 * 3. BootstrapCover: overlay JS full-screen (hitam + logo) selama
 *    status === bootstrapping, di atas Stack yang sudah mount.
 *
 * Docs: https://docs.expo.dev/router/advanced/authentication/
 *       https://docs.expo.dev/router/advanced/protected/
 *       https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/
 */
import { ThemeInkOverlay } from '@/components/theme/ThemeInkOverlay';
import { ConfirmDialogHost, ToastHost } from '@/components/ui';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { Stack } from 'expo-router';
import { Image, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Overlay full-screen selama auth hydrate.
 * Stack di bawah tetap mount (aman untuk linking); native splash sudah
 * auto-hide → cover ini menyambung branding tanpa preventAutoHide race.
 */
function BootstrapCover() {
  const { status } = useAuth();

  if (status !== 'bootstrapping') {
    return null;
  }

  return (
    <View
      style={styles.bootstrapCover}
      pointerEvents="auto"
      accessibilityLabel="Memuat aplikasi"
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <Image
        source={require('../../assets/images/splash.png')}
        style={styles.bootstrapLogo}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

/**
 * Stack navigator: theme chrome + protected route groups.
 * Harus di dalam ThemeProvider + AuthProvider.
 */
function NavigationLayout() {
  const { theme, statusBarIsDark } = useAppTheme();
  const { isAuthenticated } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.systemBackground }}>
      {/* Freeze style selama ink (frozenDark) — status bar tidak di screenshot */}
      <StatusBar
        barStyle={statusBarIsDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.systemBackground}
      />

      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.systemBackground },
          headerTintColor: theme.colors.label,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: theme.colors.systemBackground },
        }}
      >
        {/* Area privat: hanya setelah login / session valid */}
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(main)" options={{ headerShown: false }} />
        </Stack.Protected>

        {/* Area publik auth: hanya saat belum login */}
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
          <Stack.Screen
            name="(auth)/register"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(auth)/verify-email"
            options={{ headerShown: false }}
          />
        </Stack.Protected>
      </Stack>

      {/* Di atas Stack — full black + logo selama bootstrap (bukan unmount navigator) */}
      <BootstrapCover />
    </View>
  );
}

/** Entry layout file-based routing. */
export default function RootLayout() {
  return (
    <QueryProvider>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            {/* Wrapper flex-1 supaya absoluteFill ink/toast relative ke full screen */}
            <View style={{ flex: 1 }}>
              <NavigationLayout />
              {/* Toast di atas stack; butuh Theme + SafeArea di parent */}
              <ToastHost />
              {/* Confirm delete/dialog — imperative confirmDestructive */}
              <ConfirmDialogHost />
              {/* Ink reveal canvas — full screen di atas konten saat animasi */}
              <ThemeInkOverlay />
            </View>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryProvider>
  );
}

const styles = StyleSheet.create({
  bootstrapCover: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  /** ~28% lebar layar — cukup besar, tetap ada ruang napas */
  bootstrapLogo: {
    width: '72%',
    maxWidth: 320,
    aspectRatio: 1,
  },
});
