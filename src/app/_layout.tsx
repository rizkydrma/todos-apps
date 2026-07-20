/**
 * Root layout Expo Router — provider tree + auth via Stack.Protected.
 *
 * Urutan provider (luar → dalam):
 * QueryProvider → SafeArea → Theme → Auth → NavigationLayout
 *
 * Cold Start Hold (ADR-0011):
 * - Satu native splash (preventAutoHideAsync di module scope).
 * - Hide SEKALI hanya jika status bukan bootstrapping DAN pathname
 *   sudah Cold Start Destination: /login atau /todos.
 * - Tanpa BootstrapCover / Image splash.png di JS (itu double splash).
 * - Tanpa root index Redirect hop — authenticated entry = (main) → tabs todos.
 * - Root hitam selama bootstrap + sampai hide (cegah flash putih).
 *
 * Docs: https://docs.expo.dev/router/advanced/authentication/
 *       https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/
 */
import { ThemeInkOverlay } from '@/components/theme/ThemeInkOverlay';
import { ConfirmDialogHost, ToastHost } from '@/components/ui';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { SplashScreen, Stack, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Global scope — jangan di useEffect (bisa terlambat setelah auto-hide).
SplashScreen.preventAutoHideAsync();

/**
 * Cold Start Destination (v1): Login atau Home todos.
 * Group (auth)/(main)/(tabs) biasanya tidak muncul di pathname.
 */
function isColdStartDestination(pathname: string): boolean {
  if (pathname === '/login' || pathname.endsWith('/login')) return true;
  if (pathname === '/todos' || pathname.endsWith('/todos')) return true;
  return false;
}

/**
 * Stack + theme chrome. Hold native splash sampai destination siap.
 */
function NavigationLayout() {
  const { theme, statusBarIsDark } = useAppTheme();
  const { status } = useAuth();
  const pathname = usePathname();
  const didHideSplash = useRef(false);

  const authReady = status !== 'bootstrapping';
  const atDestination = isColdStartDestination(pathname);
  // Contract: status siap + sudah di login/todos — bukan cuma “bukan bootstrapping”.
  const canReleaseHold = authReady && atDestination;

  useEffect(() => {
    if (!canReleaseHold || didHideSplash.current) return;

    didHideSplash.current = true;
    // Satu frame: biar screen destination sempat paint di bawah splash.
    const frame = requestAnimationFrame(() => {
      void SplashScreen.hideAsync();
    });
    return () => cancelAnimationFrame(frame);
  }, [canReleaseHold]);

  // Hitam sampai hold lepas — cegah systemBackground putih di sela native hide.
  const surface = canReleaseHold ? theme.colors.systemBackground : '#000000';
  const barDark = canReleaseHold ? statusBarIsDark : true;

  return (
    <View style={{ flex: 1, backgroundColor: surface }}>
      <StatusBar
        barStyle={barDark ? 'light-content' : 'dark-content'}
        backgroundColor={surface}
      />

      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: surface },
          headerTintColor: canReleaseHold ? theme.colors.label : '#FFFFFF',
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: surface },
          // Tanpa animasi push saat group Protected baru aktif di bawah splash
          animation: canReleaseHold ? 'default' : 'none',
        }}
      >
        {/* Authenticated: langsung (main) — tanpa index Redirect hop */}
        <Stack.Protected guard={status === 'authenticated'}>
          <Stack.Screen name="(main)" options={{ headerShown: false }} />
        </Stack.Protected>

        {/* Unauthenticated: login dulu di list = default cold-start auth */}
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
