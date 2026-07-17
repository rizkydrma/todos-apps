/**
 * Layout group (main) — stack screen privat.
 *
 * Auth guard TIDAK di sini: sudah di root lewat Stack.Protected.
 * File ini hanya mengatur nested navigator (header, title, dll).
 */
import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen name="home" options={{ title: 'Beranda' }} />
    </Stack>
  );
}
