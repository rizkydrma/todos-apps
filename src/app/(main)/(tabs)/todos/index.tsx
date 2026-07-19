/**
 * Tab Todos: infinite list + filter drawer + swipe row.
 * Create: center + tab bar (TodoCreateProvider).
 * Edit: local TodoFormDrawer.
 */
import {
  AppText,
  PageHeaderChrome,
  PageHeaderLargeTitle,
  Screen,
  usePageHeaderCollapse,
} from '@/components/ui';
import { useAppTheme } from '@/context/ThemeContext';
import { useCategories } from '@/features/categories/queries/useCategories';
import { useTags } from '@/features/tags/queries/useTags';
import {
  countActiveTodoFilters,
  DEFAULT_TODO_FILTERS,
  TodoFilterDrawer,
  type TodoFilterValues,
} from '@/features/todos/components/TodoFilterDrawer';
import { TodoFormDrawer } from '@/features/todos/components/TodoFormDrawer';
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
import { ListFilter } from 'lucide-react-native';
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
  const { theme } = useAppTheme();
  const { scrollY, scrollHandler } = usePageHeaderCollapse();

  const [filtersState, setFiltersState] =
    useState<TodoFilterValues>(DEFAULT_TODO_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  /** Edit only — create di tab bar (TodoCreateProvider). */
  const [editId, setEditId] = useState<string | null>(null);

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
    // Scene sudah paddingBottom: tabInset — filter FAB gap token (E1 + G1).
    // Create = center + tab bar (F1: no FAB +).
    fabFilter: {
      position: 'absolute' as const,
      right: t.spacing.lg,
      bottom: t.spacing.sm,
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
      onEdit={() => setEditId(item.id)}
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
                    Belum ada todo. Ketuk + di tab bar untuk menambah.
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

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter todo"
            style={styles.fabFilter}
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

        <TodoFormDrawer
          key={editId ? `edit-${editId}` : 'edit-closed'}
          visible={editId != null}
          todoId={editId}
          onClose={() => setEditId(null)}
        />
      </Screen>
    </GestureHandlerRootView>
  );
}
