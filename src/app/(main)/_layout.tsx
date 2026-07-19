/**
 * Stack privat (main): tabs + users admin.
 * Create/edit todo = floating SheetScaffold di screen (bukan stack modal).
 * Auth guard di root Stack.Protected.
 */
import { useAppTheme } from '@/context/ThemeContext';
import { Stack } from 'expo-router';

export default function MainLayout() {
  const { theme } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.systemBackground },
        headerTintColor: theme.colors.label,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.systemBackground },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="users"
        options={{
          title: 'Users',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
