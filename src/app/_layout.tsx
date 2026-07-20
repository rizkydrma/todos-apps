/**
 * Root layout Expo Router — provider tree + auth via Stack.Protected.
 *
 * Urutan provider (luar → dalam):
 * QueryProvider → SafeArea → Theme → Auth → NavigationLayout
 *
 * Auth routing (Expo Router 57):
 * - SELALU render <Stack> (navigator harus mount — aman untuk deep link).
 * - guard status === 'authenticated' | 'unauthenticated' (bukan !isAuthenticated
 *   selama bootstrapping, supaya login tidak ikut mount di bawah splash).
 *
 * Splash (satu kali, tanpa double):
 * - preventAutoHideAsync di module scope → native splash tetap sampai auth siap.
 * - hide SEKALI di useEffect saat status lepas bootstrapping.
 * - TANPA BootstrapCover JS (itu yang bikin “splash → putih → splash lagi”).
 * - Root bg hitam selama bootstrap → cegah flash putih di sela native hide.
 *
 * Docs: https://docs.expo.dev/router/advanced/authentication/
 *       https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/
 */
import { ThemeInkOverlay } from '@/components/theme/ThemeInkOverlay';
import { ConfirmDialogHost, ToastHost } from '@/components/ui';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Global scope — jangan di useEffect (bisa terlambat setelah auto-hide).
SplashScreen.preventAutoHideAsync();

/**
 * Stack + theme chrome. Splash native di-hold sampai auth resolve.
 */
function NavigationLayout() {
  const { theme, statusBarIsDark } = useAppTheme();
  const { status } = useAuth();
  const ready = status !== 'bootstrapping';
  // Pastikan hide native cuma sekali (hindari double-hide / glitch).
  const didHideSplash = useRef(false);

  useEffect(() => {
    if (!ready || didHideSplash.current) return;

    didHideSplash.current = true;
    // Satu frame delay: biar Stack sempat commit screen yang benar
    // (authenticated → main, unauthenticated → login) sebelum splash lepas.
    const frame = requestAnimationFrame(() => {
      void SplashScreen.hideAsync();
    });
    return () => cancelAnimationFrame(frame);
  }, [ready]);

  // Hitam selama bootstrap = sama dengan splash plate; cegah flash putih light theme.
  const surface = ready ? theme.colors.systemBackground : '#000000';
  const barDark = ready ? statusBarIsDark : true;

  return (
    <View style={{ flex: 1, backgroundColor: surface }}>
      <StatusBar
        barStyle={barDark ? 'light-content' : 'dark-content'}
        backgroundColor={surface}
      />

      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: surface },
          headerTintColor: ready ? theme.colors.label : '#FFFFFF',
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: surface },
          // Hindari animasi push saat group Protected baru aktif setelah bootstrap
          animation: ready ? 'default' : 'none',
        }}
      >
        {/* Hanya setelah session valid — tidak aktif saat bootstrapping */}
        <Stack.Protected guard={status === 'authenticated'}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(main)" options={{ headerShown: false }} />
        </Stack.Protected>

        {/* Hanya setelah pasti belum login — tidak aktif saat bootstrapping */}
        <Stack.Protected guard={status === 'unauthenticated'}>
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
            {/* Hitam default: sela sebelum NavigationLayout paint tidak putih */}
            <View style={{ flex: 1, backgroundColor: '#000000' }}>
              <NavigationLayout />
              <ToastHost />
              <ConfirmDialogHost />
              <ThemeInkOverlay />
            </View>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryProvider>
  );
}
