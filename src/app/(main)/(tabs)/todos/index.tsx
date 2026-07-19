/**
 * Tab Todos: infinite list + filter drawer + swipe row.
 * Aksi per-item: full-swipe selesai/hapus (otomatis), pensil/tap edit.
 */
import {
  AppText,
  PageHeaderChrome,
  PageHeaderLargeTitle,
  Screen,
  usePageHeaderCollapse,
} from '@/components/ui';
import { useFloatingTabBarInset } from '@/components/navigation/FloatingPillTabBar';
import { useAppTheme } from '@/context/ThemeContext';
import { useCategories } from '@/features/categories/queries/useCategories';
import { useTags } from '@/features/tags/queries/useTags';
import {
  countActiveTodoFilters,
  DEFAULT_TODO_FILTERS,
  TodoFilterDrawer,
  type TodoFilterValues,
} from '@/features/todos/components/TodoFilterDrawer';
import { TodoSwipeRow } from '@/features/todos/components/TodoSwipeRow';
import { groupTodosByDue } from '@/features/todos/lib/dueSections';
import {
  useDeleteTodo,
  useToggleTodoComplete,
} from '@/features/todos/queries/useTodoMutations';
import {
  flattenTodoPages,
  useTodosInfinite,
  type TodosInfiniteFilters,
} from '@/features/todos/queries/useTodosInfinite';
import type { TodoWithRelations } from '@/features/todos/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { confirmDestructive } from '@/lib/confirm';
import { hapticCommit } from '@/lib/haptics';
import { useRouter } from 'expo-router';
import { ListFilter, Plus } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

export default function TodosScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { scrollY, scrollHandler } = usePageHeaderCollapse();
  const tabInset = useFloatingTabBarInset();

  const [filtersState, setFiltersState] =
    useState<TodoFilterValues>(DEFAULT_TODO_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const filters: TodosInfiniteFilters = useMemo(
    () => ({
      status: filtersState.status === 'all' ? undefined : filtersState.status,
      priority: filtersState.priority,
      category: filtersState.categoryId,
      tag: filtersState.tagId,
      search: filtersState.search.trim() || undefined,
      sort: filtersState.sort,
    }),
    [filtersState]
  );

  const query = useTodosInfinite(filters);
  const items = flattenTodoPages(query.data);
  const sections = useMemo(() => groupTodosByDue(items), [items]);
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const toggleComplete = useToggleTodoComplete();
  const deleteTodo = useDeleteTodo();

  const activeFilterCount = countActiveTodoFilters(filtersState);

  const styles = useThemedStyles((t) => ({
    root: { flex: 1 },
    sectionTitle: {
      paddingHorizontal: t.spacing.md,
      paddingTop: t.spacing.md,
      paddingBottom: t.spacing.xs,
    },
    group: {
      marginHorizontal: t.spacing.md,
      backgroundColor: t.colors.secondarySystemGroupedBackground,
      borderRadius: t.radius.xl,
      overflow: 'hidden' as const,
      marginBottom: t.spacing.sm,
    },
    fabCol: {
      position: 'absolute' as const,
      right: t.spacing.lg,
      gap: t.spacing.sm,
      alignItems: 'center' as const,
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: t.radius.full,
      backgroundColor: t.colors.primary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: t.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 4,
    },
    fabSecondary: {
      width: 48,
      height: 48,
      borderRadius: t.radius.full,
      backgroundColor: t.colors.secondarySystemGroupedBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.separator,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: t.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 3,
    },
    fabBadge: {
      position: 'absolute' as const,
      top: -2,
      right: -2,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 4,
      backgroundColor: t.colors.primary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    empty: {
      textAlign: 'center' as const,
      marginTop: t.spacing.xxl,
      paddingHorizontal: t.spacing.lg,
    },
  }));

  const onToggle = useCallback(
    (item: TodoWithRelations) => {
      void hapticCommit('light');
      toggleComplete.mutate({ id: item.id, completed: !item.completed });
    },
    [toggleComplete]
  );

  const onDelete = useCallback(
    async (item: TodoWithRelations) => {
      const ok = await confirmDestructive({
        title: 'Hapus todo?',
        message: `"${item.title}" akan dihapus permanen.`,
      });
      if (!ok) return;
      void hapticCommit('warning');
      deleteTodo.mutate(item.id);
    },
    [deleteTodo]
  );

  const renderRow = (item: TodoWithRelations, isLast: boolean) => (
    <TodoSwipeRow
      key={item.id}
      item={item}
      isLast={isLast}
      onToggleComplete={() => onToggle(item)}
      onDelete={() => {
        void onDelete(item);
      }}
      onEdit={() =>
        router.push({
          pathname: '/(main)/todo-form',
          params: { id: item.id },
        })
      }
    />
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <Screen background="systemGroupedBackground" safe={{ top: false }}>
        <View style={styles.root}>
          <PageHeaderChrome title="Home" scrollY={scrollY} />
          {query.isLoading ? (
            <>
              <PageHeaderLargeTitle title="Home" subtitle="Todos kamu" />
              <ActivityIndicator style={{ marginTop: 40 }} />
            </>
          ) : (
            <Animated.FlatList
              data={sections}
              keyExtractor={(s) => s.key}
              ListHeaderComponent={
                <PageHeaderLargeTitle title="Home" subtitle="Todos kamu" />
              }
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              refreshControl={
                <RefreshControl
                  refreshing={query.isRefetching && !query.isFetchingNextPage}
                  onRefresh={() => query.refetch()}
                />
              }
              onEndReached={() => {
                if (query.hasNextPage && !query.isFetchingNextPage) {
                  void query.fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.4}
              ListEmptyComponent={
                !query.isLoading ? (
                  <AppText
                    variant="subtitle"
                    color="secondaryLabel"
                    style={styles.empty}
                  >
                    Belum ada todo. Ketuk + untuk menambah.
                  </AppText>
                ) : null
              }
              ListFooterComponent={
                query.isFetchingNextPage ? (
                  <ActivityIndicator style={{ marginVertical: 16 }} />
                ) : null
              }
              renderItem={({ item: section }) => (
                <View>
                  <AppText
                    variant="caption"
                    color="secondaryLabel"
                    style={styles.sectionTitle}
                  >
                    {section.title}
                  </AppText>
                  <View style={styles.group}>
                    {section.items.map((todo, i) =>
                      renderRow(todo, i === section.items.length - 1)
                    )}
                  </View>
                </View>
              )}
            />
          )}

          <View style={[styles.fabCol, { bottom: tabInset + 8 }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filter todo"
              style={styles.fabSecondary}
              onPress={() => setFilterOpen(true)}
            >
              <ListFilter
                size={22}
                color={theme.colors.label}
                strokeWidth={2.2}
              />
              {activeFilterCount > 0 ? (
                <View style={styles.fabBadge}>
                  <AppText
                    variant="caption"
                    color="onPrimary"
                    style={{ fontSize: 11, lineHeight: 14 }}
                  >
                    {activeFilterCount}
                  </AppText>
                </View>
              ) : null}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tambah todo"
              style={styles.fab}
              onPress={() => router.push('/(main)/todo-form')}
            >
              <Plus
                size={28}
                color={theme.colors.onPrimary}
                strokeWidth={2.4}
              />
            </Pressable>
          </View>
        </View>

        <TodoFilterDrawer
          key={
            filterOpen
              ? `filter-${JSON.stringify(filtersState)}`
              : 'filter-closed'
          }
          visible={filterOpen}
          onClose={() => setFilterOpen(false)}
          values={filtersState}
          onApply={setFiltersState}
          categories={categories}
          tags={tags}
        />
      </Screen>
    </GestureHandlerRootView>
  );
}
