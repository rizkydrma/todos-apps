/**
 * Root layout Expo Router — provider tree + auth via Stack.Protected.
 *
 * Urutan provider (luar → dalam):
 * QueryProvider → SafeArea → Theme → Auth → NavigationLayout
 *
 * Auth routing (Expo Router 57):
 * 1. status === bootstrapping → return null (native splash masih di-hold)
 * 2. Stack.Protected guard={authenticated} → (main) + index
 * 3. Stack.Protected guard={!authenticated} → login + register
 *
 * Splash: preventAutoHide di module scope, hide sekali saat auth siap.
 * Docs: https://docs.expo.dev/router/advanced/authentication/
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

// Global scope — jangan di useEffect (bisa terlambat setelah auto-hide).
SplashScreen.preventAutoHideAsync();

/**
 * Stack navigator: theme chrome + protected route groups.
 * Harus di dalam ThemeProvider + AuthProvider.
 */
function NavigationLayout() {
  const { theme, statusBarIsDark } = useAppTheme();
  const { status, isAuthenticated } = useAuth();

  // Hide native splash sekali saat auth lepas bootstrapping.
  useEffect(() => {
    if (status !== 'bootstrapping') {
      void SplashScreen.hideAsync();
    }
  }, [status]);

  // Jangan render spinner — native splash masih visible. Spinner = "splash kedua".
  if (status === 'bootstrapping') {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.systemBackground }}>
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
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(main)" options={{ headerShown: false }} />
        </Stack.Protected>

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
            <View style={{ flex: 1 }}>
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
