import { AuthProvider } from '@/context/AuthContext';
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
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <NavigationLayout />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryProvider>
  );
}
