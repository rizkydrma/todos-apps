/**
 * Anchor route `/` (hanya reachable saat authenticated via Stack.Protected).
 * Langsung arahkan ke beranda — root index tidak menampilkan UI sendiri.
 */
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(main)/home" />;
}
