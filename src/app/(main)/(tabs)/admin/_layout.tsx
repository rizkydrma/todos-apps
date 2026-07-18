/**
 * Admin stack — hanya untuk role admin (tab di-hide untuk non-admin).
 */
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { Redirect, Stack } from 'expo-router';

export default function AdminLayout() {
  const { user } = useAuth();
  const { theme } = useAppTheme();

  if (user?.role !== 'admin') {
    return <Redirect href="/(main)/(tabs)/todos" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.systemBackground },
        headerTintColor: theme.colors.label,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Admin' }} />
      <Stack.Screen name="categories" options={{ title: 'Kategori' }} />
      <Stack.Screen name="tags" options={{ title: 'Tags' }} />
      <Stack.Screen name="users" options={{ title: 'Users' }} />
    </Stack>
  );
}
