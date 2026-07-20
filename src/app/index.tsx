/**
 * Anchor route `/` (hanya reachable saat authenticated via Stack.Protected).
 * Langsung arahkan ke beranda — root index tidak menampilkan UI sendiri.
 *
 * View hitam di belakang Redirect: cegah flash putih 1 frame saat
 * navigasi `/` → `/(main)/(tabs)/todos` setelah splash hide.
 */
import { Redirect } from 'expo-router';
import { View } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <Redirect href="/(main)/(tabs)/todos" />
    </View>
  );
}
