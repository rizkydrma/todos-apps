/**
 * Root layout Expo Router — provider tree + auth via Stack.Protected.
 *
 * Urutan provider (luar → dalam):
 * QueryProvider → SafeArea → Theme → Auth → NavigationLayout
 *
 * Auth routing (Expo Router 57 idiomatic):
 * 1. status === bootstrapping → underlay hitam (native splash masih di atas)
 * 2. Stack.Protected guard={authenticated} → (main) + index
 * 3. Stack.Protected guard={!authenticated} → login + register
 *
 * Splash (native):
 * - preventAutoHideAsync di module scope agar splash tetap tampil
 *   sampai AuthContext selesai hydrate SecureStore + refresh.
 * - hideAsync saat status !== bootstrapping → user langsung ke login/main,
 *   bukan spinner sebagai “ganti splash”.
 * - Setelah ganti asset/plugin di app.json: rebuild native (bukan hanya Metro).
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
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
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
 * Stack navigator: theme chrome + protected route groups.
 * Harus di dalam ThemeProvider + AuthProvider.
 */
function NavigationLayout() {
  const { theme, statusBarIsDark } = useAppTheme();
  const { status, isAuthenticated } = useAuth();

  // Sembunyikan splash native setelah session resolve (login atau main siap digambar).
  // void: fire-and-forget; kegagalan hide tidak boleh memblokir navigasi.
  useEffect(() => {
    if (status === 'bootstrapping') return;

    void SplashScreen.hideAsync().catch(() => {
      // Best-effort: UI tetap lanjut lewat Stack; underlay hitam mencegah flash putih.
    });
  }, [status]);

  // Native splash masih menutupi layer ini; hitam = aman jika hide race / dev client aneh.
  // Jangan ActivityIndicator mencolok — itu yang diganti splash branded.
  if (status === 'bootstrapping') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
      </View>
    );
  }

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
