/**
 * Root layout Expo Router — provider tree + auth via Stack.Protected.
 *
 * Urutan provider (luar → dalam):
 * QueryProvider → SafeArea → Theme → Auth → NavigationLayout
 *
 * Auth routing (Expo Router 57 idiomatic):
 * 1. status === bootstrapping → spinner (jangan putuskan guard dulu; cegah flash)
 * 2. Stack.Protected guard={authenticated} → (main) + index
 * 3. Stack.Protected guard={!authenticated} → login + register
 *
 * Docs: https://docs.expo.dev/router/advanced/authentication/
 *       https://docs.expo.dev/router/advanced/protected/
 */
import { ThemeInkOverlay } from '@/components/theme/ThemeInkOverlay';
import { ConfirmDialogHost, ToastHost } from '@/components/ui';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { Stack } from 'expo-router';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Stack navigator: theme chrome + protected route groups.
 * Harus di dalam ThemeProvider + AuthProvider.
 */
function NavigationLayout() {
  const { theme, statusBarIsDark } = useAppTheme();
  const { status, isAuthenticated } = useAuth();

  // Tunggu hydrate SecureStore + refresh token — jangan evaluasi guard dulu
  if (status === 'bootstrapping') {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.systemBackground,
        }}
      >
        <StatusBar
          barStyle={statusBarIsDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.systemBackground}
        />
        <ActivityIndicator />
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
