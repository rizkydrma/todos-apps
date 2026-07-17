import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function NavigationLayout() {
  const { isDarkMode, theme } = useAppTheme();

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen options={{ headerShown: false }} name="(auth)/login" />
        <Stack.Screen options={{ headerShown: false }} name="(auth)/register" />
        <Stack.Screen name="(main)/home" options={{ title: 'Beranda' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationLayout />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
