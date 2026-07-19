/**
 * Tab Todos: infinite list + multi-select + batch.
 * Filter tidak di-expand di list — floating drawer (select/option).
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
  TodoFilterDrawer,
  type TodoFilterValues,
} from '@/features/todos/components/TodoFilterDrawer';
import { groupTodosByDue } from '@/features/todos/lib/dueSections';
import {
  useBatchTodos,
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
import { toast } from '@/lib/toast';
import { todosApi } from '@/features/todos/api/todos.api';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ListFilter, Plus } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';

const DEFAULT_FILTERS: TodoFilterValues = {
  status: 'active',
  priority: undefined,
  categoryId: undefined,
  tagId: undefined,
  sort: '-createdAt',
  search: '',
};

export default function TodosScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { scrollY, scrollHandler } = usePageHeaderCollapse();
  const tabInset = useFloatingTabBarInset();

  const [filtersState, setFiltersState] =
    useState<TodoFilterValues>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

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
  const batch = useBatchTodos();

  const activeFilterCount = countActiveTodoFilters(filtersState);

  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (filtersState.status !== 'active') {
      parts.push(
        filtersState.status === 'all'
          ? 'Semua status'
          : filtersState.status === 'completed'
            ? 'Selesai'
            : 'Aktif'
      );
    }
    if (filtersState.priority) parts.push(filtersState.priority);
    if (filtersState.categoryId) {
      const c = categories.find((x) => x.id === filtersState.categoryId);
      if (c) parts.push(c.name);
    }
    if (filtersState.tagId) {
      const t = tags.find((x) => x.id === filtersState.tagId);
      if (t) parts.push(t.name);
    }
    if (filtersState.search.trim()) {
      parts.push(`“${filtersState.search.trim()}”`);
    }
    if (filtersState.sort && filtersState.sort !== '-createdAt') {
      parts.push('Sort custom');
    }
    return parts.length ? parts.join(' · ') : 'Filter default (aktif)';
  }, [filtersState, categories, tags]);

  const styles = useThemedStyles((t) => ({
    root: { flex: 1 },
    summaryRow: {
      marginHorizontal: t.spacing.lg,
      marginBottom: t.spacing.sm,
      paddingVertical: t.spacing.sm,
      paddingHorizontal: t.spacing.md,
      borderRadius: t.radius.lg,
      backgroundColor: t.colors.tertiarySystemFill,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.sm,
      minHeight: t.size.touchMin,
    },
    toolbar: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: t.spacing.lg,
      marginBottom: t.spacing.sm,
      gap: t.spacing.sm,
    },
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
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: t.spacing.md,
      gap: t.spacing.sm,
      minHeight: t.size.touchMin,
    },
    rowBody: { flex: 1, gap: 2 },
    meta: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: t.spacing.xs,
      marginTop: 4,
    },
    badge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: t.radius.sm,
      backgroundColor: t.colors.tertiarySystemFill,
    },
    fabCol: {
      position: 'absolute' as const,
      right: t.spacing.lg,
      // Di atas floating pill tab bar
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
      // Soft float
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
    selectBar: {
      flexDirection: 'row' as const,
      gap: t.spacing.sm,
      padding: t.spacing.md,
      borderTopWidth: 1,
      borderTopColor: t.colors.separator,
      backgroundColor: t.colors.secondarySystemBackground,
    },
    empty: {
      textAlign: 'center' as const,
      marginTop: t.spacing.xxl,
      paddingHorizontal: t.spacing.lg,
    },
    separator: {
      height: 1,
      backgroundColor: t.colors.separator,
      marginLeft: t.spacing.md + 28,
      opacity: 0.5,
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

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runMultiComplete = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    const results = await Promise.allSettled(
      ids.map((id) => todosApi.update(id, { completed: true }))
    );
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const fail = results.length - ok;
    toast.success({
      message: fail
        ? `${ok} selesai, ${fail} gagal`
        : `${ok} todo ditandai selesai`,
    });
    setSelected(new Set());
    setSelectMode(false);
    void query.refetch();
  };

  const runMultiDelete = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    const okConfirm = await confirmDestructive({
      title: `Hapus ${ids.length} todo?`,
      message: 'Tindakan ini tidak bisa dibatalkan.',
    });
    if (!okConfirm) return;
    void hapticCommit('warning');
    const results = await Promise.allSettled(
      ids.map((id) => todosApi.remove(id))
    );
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const fail = results.length - ok;
    toast.success({
      message: fail ? `${ok} dihapus, ${fail} gagal` : `${ok} todo dihapus`,
    });
    setSelected(new Set());
    setSelectMode(false);
    void query.refetch();
  };

  const onBatch = async (action: 'complete-all' | 'delete-completed') => {
    if (action === 'delete-completed') {
      const ok = await confirmDestructive({
        title: 'Hapus semua yang selesai?',
        message: 'Semua todo completed akan dihapus.',
      });
      if (!ok) return;
    } else {
      const ok = await confirmDestructive({
        title: 'Selesaikan semua?',
        message: 'Semua todo aktif akan ditandai selesai.',
        confirmLabel: 'Selesaikan',
      });
      if (!ok) return;
    }
    batch.mutate(action);
  };

  const patchFilters = (patch: Partial<TodoFilterValues>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }));
  };

  const renderRow = (item: TodoWithRelations, isLast: boolean) => (
    <View key={item.id}>
      <Pressable
        style={styles.row}
        onPress={() => {
          if (selectMode) {
            toggleSelect(item.id);
            return;
          }
          router.push({
            pathname: '/(main)/todo-form',
            params: { id: item.id },
          });
        }}
        onLongPress={() => {
          setSelectMode(true);
          toggleSelect(item.id);
        }}
      >
        {selectMode ? (
          <Pressable onPress={() => toggleSelect(item.id)} hitSlop={8}>
            <SymbolView
              name={selected.has(item.id) ? 'checkmark.circle.fill' : 'circle'}
              size={24}
              tintColor={
                selected.has(item.id)
                  ? theme.colors.primary
                  : theme.colors.secondaryLabel
              }
            />
          </Pressable>
        ) : (
          <Pressable onPress={() => onToggle(item)} hitSlop={8}>
            <SymbolView
              name={item.completed ? 'checkmark.circle.fill' : 'circle'}
              size={24}
              tintColor={
                item.completed
                  ? theme.colors.primary
                  : theme.colors.secondaryLabel
              }
            />
          </Pressable>
        )}
        <View style={styles.rowBody}>
          <AppText
            variant="body"
            color={item.completed ? 'secondaryLabel' : 'label'}
            style={
              item.completed
                ? { textDecorationLine: 'line-through' }
                : undefined
            }
            numberOfLines={2}
          >
            {item.title}
          </AppText>
          <View style={styles.meta}>
            <View style={styles.badge}>
              <AppText variant="caption" color="secondaryLabel">
                {item.priority}
              </AppText>
            </View>
            {item.category ? (
              <View
                style={[
                  styles.badge,
                  item.category.color
                    ? { backgroundColor: item.category.color + '33' }
                    : null,
                ]}
              >
                <AppText variant="caption" color="secondaryLabel">
                  {item.category.name}
                </AppText>
              </View>
            ) : null}
            {item.dueDate ? (
              <AppText variant="caption" color="secondaryLabel">
                {new Date(item.dueDate).toLocaleDateString()}
              </AppText>
            ) : null}
          </View>
        </View>
        {!selectMode ? (
          <Pressable onPress={() => onDelete(item)} hitSlop={8}>
            <AppText variant="link" color="destructive">
              Hapus
            </AppText>
          </Pressable>
        ) : null}
      </Pressable>
      {!isLast ? <View style={styles.separator} /> : null}
    </View>
  );

  const listHeader = (
    <View>
      <PageHeaderLargeTitle title="Home" subtitle="Todos kamu" />

      {/* Ringkasan filter — tap buka drawer */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Buka filter"
        onPress={() => setFilterOpen(true)}
        style={styles.summaryRow}
      >
        <ListFilter size={18} color={theme.colors.primary} strokeWidth={2.2} />
        <AppText
          variant="caption"
          color="secondaryLabel"
          numberOfLines={2}
          style={{ flex: 1 }}
        >
          {filterSummary}
        </AppText>
        <AppText variant="caption" color="primary">
          Ubah
        </AppText>
      </Pressable>

      <View style={styles.toolbar}>
        <Pressable
          onPress={() => {
            setSelectMode((v) => !v);
            setSelected(new Set());
          }}
        >
          <AppText variant="link" color="primary">
            {selectMode ? 'Selesai pilih' : 'Pilih banyak'}
          </AppText>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable onPress={() => onBatch('complete-all')}>
            <AppText variant="caption" color="primary">
              Selesai semua
            </AppText>
          </Pressable>
          <Pressable onPress={() => onBatch('delete-completed')}>
            <AppText variant="caption" color="destructive">
              Hapus selesai
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
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
            ListHeaderComponent={listHeader}
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

        {selectMode ? (
          <View style={styles.selectBar}>
            <Pressable onPress={runMultiComplete} style={{ flex: 1 }}>
              <AppText
                variant="label"
                color="primary"
                style={{ textAlign: 'center' }}
              >
                Selesai ({selected.size})
              </AppText>
            </Pressable>
            <Pressable onPress={runMultiDelete} style={{ flex: 1 }}>
              <AppText
                variant="label"
                color="destructive"
                style={{ textAlign: 'center' }}
              >
                Hapus ({selected.size})
              </AppText>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.fabCol, { bottom: tabInset + 8 }]}>
            {/* Floating filter → drawer */}
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
        )}
      </View>

      <TodoFilterDrawer
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        values={filtersState}
        onChange={patchFilters}
        onReset={() => setFiltersState(DEFAULT_FILTERS)}
        categories={categories}
        tags={tags}
      />
    </Screen>
  );
}
