import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { Stack } from 'expo-router';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function NavigationLayout() {
  const { isDarkMode, theme } = useAppTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen options={{ headerShown: false }} name="(auth)/login" />
        <Stack.Screen options={{ headerShown: false }} name="(auth)/register" />
        <Stack.Screen name="(main)/home" options={{ title: 'Beranda' }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <SafeAreaProvider>
        <ThemeProvider>
          <NavigationLayout />
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryProvider>
  );
}
