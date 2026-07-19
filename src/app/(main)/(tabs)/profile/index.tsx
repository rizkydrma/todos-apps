/**
 * Tab Profil: identitas, theme, logout, pintu admin Users.
 */
import {
  AppText,
  Button,
  InitialsAvatar,
  PageHeader,
  Screen,
  ThemeToggle,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type Href, useRouter } from 'expo-router';
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
    identity: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.md,
    },
    identityText: {
      flex: 1,
      gap: t.spacing.xs,
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
      {/* Static composite: chrome (ThemeToggle trailing) + large title */}
      <PageHeader
        title="Profile"
        subtitle={user?.email ?? undefined}
        trailing={<ThemeToggle variant="icon" />}
      />
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.identity}>
            <InitialsAvatar name={user?.name} email={user?.email} size={56} />
            <View style={styles.identityText}>
              <AppText variant="headline">{user?.name ?? '—'}</AppText>
              <AppText variant="body" color="secondaryLabel">
                {user?.email}
              </AppText>
              <AppText variant="caption" color="secondaryLabel">
                Role: {user?.role ?? 'user'}
              </AppText>
            </View>
          </View>
        </View>

        {user?.role === 'admin' ? (
          <Button
            title="Kelola users"
            variant="tinted"
            onPress={() => router.push('/(main)/users' as Href)}
          />
        ) : null}

        <Button title="Keluar" variant="destructive" onPress={onSignOut} />
      </View>
    </Screen>
  );
}
