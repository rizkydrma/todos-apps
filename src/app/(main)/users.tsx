/**
 * Admin list users (stack privat) — dibuka dari Profile.
 * Search, role toggle, delete (confirm).
 */
import { AppText, Screen } from '@/components/ui';
import { useAppTheme } from '@/context/ThemeContext';
import {
  useDeleteUser,
  useUpdateUserRole,
  useUsersInfinite,
} from '@/features/users/queries/useUsers';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { confirmDestructive } from '@/lib/confirm';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  TextInput,
  View,
} from 'react-native';

export default function UsersScreen() {
  const { theme } = useAppTheme();
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const query = useUsersInfinite(applied);
  const updateRole = useUpdateUserRole();
  const remove = useDeleteUser();
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  const styles = useThemedStyles((t) => ({
    content: { padding: t.spacing.md, flexGrow: 1 },
    search: {
      borderWidth: 1,
      borderColor: t.colors.separator,
      borderRadius: t.radius.lg,
      padding: t.spacing.md,
      marginBottom: t.spacing.md,
      color: t.colors.label,
      backgroundColor: t.colors.tertiarySystemFill,
    },
    row: {
      padding: t.spacing.md,
      backgroundColor: t.colors.secondarySystemGroupedBackground,
      borderRadius: t.radius.lg,
      marginBottom: t.spacing.sm,
      gap: t.spacing.xs,
    },
    actions: { flexDirection: 'row' as const, gap: t.spacing.md, marginTop: 8 },
  }));

  return (
    <Screen background="systemGroupedBackground" safe={{ top: false }}>
      {/* Title/back dari Stack header di (main)/_layout — tidak double PageHeader */}
      <FlatList
        data={items}
        keyExtractor={(u) => u.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => setApplied(search.trim())}
            placeholder="Cari user..."
            placeholderTextColor={theme.colors.placeholderText}
            style={styles.search}
            returnKeyType="search"
          />
        }
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage();
          }
        }}
        ListFooterComponent={
          query.isFetchingNextPage ? <ActivityIndicator /> : null
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <AppText variant="body">{item.name}</AppText>
            <AppText variant="caption" color="secondaryLabel">
              {item.email}
            </AppText>
            <AppText variant="caption" color="secondaryLabel">
              role: {item.role}
            </AppText>
            <View style={styles.actions}>
              <Pressable
                onPress={async () => {
                  const next = item.role === 'admin' ? 'user' : 'admin';
                  const ok = await confirmDestructive({
                    title: `Ubah role ke ${next}?`,
                    message: item.email,
                    confirmLabel: 'Ubah',
                  });
                  if (ok) {
                    updateRole.mutate({
                      id: item.id,
                      body: { role: next },
                    });
                  }
                }}
              >
                <AppText color="primary">
                  Jadikan {item.role === 'admin' ? 'user' : 'admin'}
                </AppText>
              </Pressable>
              <Pressable
                onPress={async () => {
                  const ok = await confirmDestructive({
                    title: 'Hapus user?',
                    message: item.email,
                  });
                  if (ok) remove.mutate(item.id);
                }}
              >
                <AppText color="destructive">Hapus</AppText>
              </Pressable>
            </View>
          </View>
        )}
      />
    </Screen>
  );
}
