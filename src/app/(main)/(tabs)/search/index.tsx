/**
 * Tab Search: cari todo by title (API filter `search`).
 * Debounce input → infinite list hasil.
 * PageHeader HIG: chrome sticky + large title collapsible.
 */
import {
  AppText,
  PageHeaderChrome,
  PageHeaderLargeTitle,
  Screen,
  usePageHeaderCollapse,
} from '@/components/ui';
import { useAppTheme } from '@/context/ThemeContext';
import {
  flattenTodoPages,
  useTodosInfinite,
} from '@/features/todos/queries/useTodosInfinite';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRouter } from 'expo-router';
import { Search as SearchIcon } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

const DEBOUNCE_MS = 350;

export default function SearchScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { scrollY, scrollHandler } = usePageHeaderCollapse();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const filters = useMemo(
    () => (debounced.length > 0 ? { search: debounced } : {}),
    [debounced]
  );

  const enabled = debounced.length > 0;
  const todosQuery = useTodosInfinite(filters, { enabled });
  const items = enabled ? flattenTodoPages(todosQuery.data) : [];

  const styles = useThemedStyles((t) => ({
    content: {
      paddingHorizontal: t.spacing.md,
      paddingBottom: t.spacing.md,
      flexGrow: 1,
    },
    searchRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.sm,
      borderWidth: 1,
      borderColor: t.colors.separator,
      borderRadius: t.radius.lg,
      paddingHorizontal: t.spacing.md,
      minHeight: t.size.controlHeight,
      backgroundColor: t.colors.tertiarySystemFill,
      marginBottom: t.spacing.md,
      marginHorizontal: t.spacing.lg - t.spacing.md,
    },
    input: {
      flex: 1,
      fontSize: t.fontSize.md,
      color: t.colors.label,
      paddingVertical: t.spacing.sm,
    },
    row: {
      padding: t.spacing.md,
      backgroundColor: t.colors.secondarySystemGroupedBackground,
      borderRadius: t.radius.lg,
      marginBottom: t.spacing.sm,
      gap: t.spacing.xs,
    },
  }));

  return (
    <Screen background="systemGroupedBackground" safe={{ top: false }}>
      <PageHeaderChrome title="Search" scrollY={scrollY} />
      <Animated.FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View>
            <PageHeaderLargeTitle
              title="Search"
              subtitle="Cari todo berdasarkan judul"
            />
            <View style={styles.searchRow}>
              <SearchIcon
                size={20}
                color={theme.colors.secondaryLabel}
                strokeWidth={2}
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Cari todo..."
                placeholderTextColor={theme.colors.placeholderText}
                style={styles.input}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="while-editing"
                accessibilityLabel="Cari todo"
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={{ paddingVertical: 24 }}>
            {!debounced ? (
              <AppText color="secondaryLabel" style={{ textAlign: 'center' }}>
                Ketik judul todo untuk mencari
              </AppText>
            ) : todosQuery.isLoading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <AppText color="secondaryLabel" style={{ textAlign: 'center' }}>
                Tidak ada hasil untuk “{debounced}”
              </AppText>
            )}
          </View>
        }
        onEndReached={() => {
          if (
            enabled &&
            todosQuery.hasNextPage &&
            !todosQuery.isFetchingNextPage
          ) {
            void todosQuery.fetchNextPage();
          }
        }}
        ListFooterComponent={
          todosQuery.isFetchingNextPage ? (
            <ActivityIndicator style={{ marginVertical: 12 }} />
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/(main)/todo-form',
                params: { id: item.id },
              })
            }
          >
            <AppText variant="body">{item.title}</AppText>
            <AppText variant="caption" color="secondaryLabel">
              {item.completed ? 'Selesai' : 'Aktif'}
              {item.priority ? ` · ${item.priority}` : ''}
            </AppText>
          </Pressable>
        )}
      />
    </Screen>
  );
}
