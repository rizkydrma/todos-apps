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
 * - Splash native di-hold sampai status lepas bootstrapping (SplashScreenController)
 *
 * Kenapa tidak return null/spinner tanpa Stack?
 * - useLinking (getInitialURL promise) bisa setState ke fiber navigator
 *   yang belum mount → warning "Can't perform a React state update on a
 *   component that hasn't mounted yet".
 * - Docs: https://docs.expo.dev/router/advanced/authentication/
 *
 * Splash:
 * - preventAutoHideAsync di module scope (bukan di useEffect).
 * - hide() di SplashScreenController saat status !== bootstrapping.
 * - Setelah ganti asset/plugin di app.json: rebuild native (bukan hanya Metro).
 *
 * Docs: https://docs.expo.dev/router/advanced/protected/
 *       https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/
 */
import { ThemeInkOverlay } from '@/components/theme/ThemeInkOverlay';
import { ConfirmDialogHost, ToastHost } from '@/components/ui';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Harus di global scope (bukan di dalam useEffect) — kalau terlambat, splash sudah auto-hide.
// Docs Expo: preventAutoHideAsync recommended at module level without awaiting registration.
SplashScreen.preventAutoHideAsync();

// Fade out native splash (fade berlaku di iOS). Duration pendek agar tidak terasa “nunggu animasi”.
SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

/**
 * Hide native splash begitu auth bootstrap selesai.
 * Pola docs Expo: komponen kecil di dalam AuthProvider; hide saat !loading.
 * Dipanggil di render (bukan useEffect) agar sinkron dengan frame pertama status siap.
 */
function SplashScreenController() {
  const { status } = useAuth();

  if (status !== 'bootstrapping') {
    // Best-effort: jangan biarkan kegagalan hide memblokir tree
    void SplashScreen.hideAsync().catch(() => {});
  }

  return null;
}

/**
 * Stack navigator: theme chrome + protected route groups.
 * Harus di dalam ThemeProvider + AuthProvider.
 * Selalu mount <Stack> — splash native menutupi UI sampai bootstrap selesai.
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

        {/* Area publik auth: hanya saat belum login (termasuk selama bootstrapping di bawah splash) */}
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
              {/* Harus di dalam AuthProvider — baca status bootstrap */}
              <SplashScreenController />
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
