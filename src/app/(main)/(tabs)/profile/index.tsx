/**
 * Tab Profil: identitas, theme, logout, pintu admin.
 */
import { AppText, Button, Screen, ThemeToggle } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const styles = useThemedStyles((t) => ({
    content: {
      flex: 1,
      padding: t.spacing.lg,
      gap: t.spacing.lg,
    },
    card: {
      backgroundColor: t.colors.secondarySystemGroupedBackground,
      borderRadius: t.radius.xl,
      padding: t.spacing.lg,
      gap: t.spacing.sm,
    },
    row: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
  }));

  const onSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <Screen background="systemGroupedBackground" safe={{ top: false }}>
      <View style={styles.content}>
        <View style={styles.card}>
          <AppText variant="headline">{user?.name ?? '—'}</AppText>
          <AppText variant="body" color="secondaryLabel">
            {user?.email}
          </AppText>
          <AppText variant="caption" color="secondaryLabel">
            Role: {user?.role ?? 'user'}
          </AppText>
        </View>

        <View style={[styles.card, styles.row]}>
          <AppText variant="body">Tampilan</AppText>
          <ThemeToggle variant="icon" />
        </View>

        {user?.role === 'admin' ? (
          <Button
            title="Buka Admin"
            variant="tinted"
            onPress={() => router.push('/(main)/(tabs)/admin')}
          />
        ) : null}

        <Button title="Keluar" variant="destructive" onPress={onSignOut} />
      </View>
    </Screen>
  );
}
