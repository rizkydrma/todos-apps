/**
 * Tab Todos: infinite list + filters + multi-select + batch + HIG grouped UI.
 * Data dari Todo Service (bukan state lokal).
 */
import { AppText, Screen } from '@/components/ui';
import { useAppTheme } from '@/context/ThemeContext';
import { useCategories } from '@/features/categories/queries/useCategories';
import { useTags } from '@/features/tags/queries/useTags';
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
import type { Priority, TodoWithRelations } from '@/features/todos/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { confirmDestructive } from '@/lib/confirm';
import { hapticCommit } from '@/lib/haptics';
import { toast } from '@/lib/toast';
import { todosApi } from '@/features/todos/api/todos.api';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

type StatusFilter = 'all' | 'active' | 'completed';

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles((t) => ({
    chip: {
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xs,
      borderRadius: t.radius.full,
      backgroundColor: t.colors.tertiarySystemFill,
    },
    chipActive: {
      backgroundColor: t.colors.primary,
    },
  }));
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <AppText variant="caption" color={active ? 'onPrimary' : 'label'}>
        {label}
      </AppText>
    </Pressable>
  );
}

export default function TodosScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [status, setStatus] = useState<StatusFilter>('active');
  const [priority, setPriority] = useState<Priority | undefined>();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [tagId, setTagId] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState<TodosInfiniteFilters['sort']>('-createdAt');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filters: TodosInfiniteFilters = useMemo(
    () => ({
      status: status === 'all' ? undefined : status,
      priority,
      category: categoryId,
      tag: tagId,
      search: search || undefined,
      sort,
    }),
    [status, priority, categoryId, tagId, search, sort]
  );

  const query = useTodosInfinite(filters);
  const items = flattenTodoPages(query.data);
  const sections = useMemo(() => groupTodosByDue(items), [items]);
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const toggleComplete = useToggleTodoComplete();
  const deleteTodo = useDeleteTodo();
  const batch = useBatchTodos();

  const styles = useThemedStyles((t) => ({
    root: { flex: 1 },
    chips: {
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm,
      gap: t.spacing.sm,
    },
    chipRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: t.spacing.xs,
      marginBottom: t.spacing.xs,
    },
    search: {
      borderWidth: 1,
      borderColor: t.colors.separator,
      borderRadius: t.radius.lg,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm,
      color: t.colors.label,
      backgroundColor: t.colors.tertiarySystemFill,
      marginBottom: t.spacing.sm,
      minHeight: t.size.controlHeight,
    },
    toolbar: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: t.spacing.md,
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
    fab: {
      position: 'absolute' as const,
      right: t.spacing.lg,
      bottom: t.spacing.lg,
      width: 56,
      height: 56,
      borderRadius: t.radius.full,
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
      <View style={styles.chips}>
        <TextInput
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={() => setSearch(searchInput.trim())}
          placeholder="Cari todo..."
          placeholderTextColor={theme.colors.placeholderText}
          style={styles.search}
          returnKeyType="search"
        />
        <View style={styles.chipRow}>
          {(['all', 'active', 'completed'] as StatusFilter[]).map((s) => (
            <FilterChip
              key={s}
              label={s}
              active={status === s}
              onPress={() => setStatus(s)}
            />
          ))}
        </View>
        <View style={styles.chipRow}>
          {([undefined, 'low', 'medium', 'high'] as const).map((p) => (
            <FilterChip
              key={p ?? 'any'}
              label={p ?? 'any priority'}
              active={priority === p}
              onPress={() => setPriority(p)}
            />
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            <FilterChip
              label="Semua kategori"
              active={!categoryId}
              onPress={() => setCategoryId(undefined)}
            />
            {categories.map((c) => (
              <FilterChip
                key={c.id}
                label={c.name}
                active={categoryId === c.id}
                onPress={() => setCategoryId(c.id)}
              />
            ))}
          </View>
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            <FilterChip
              label="Semua tag"
              active={!tagId}
              onPress={() => setTagId(undefined)}
            />
            {tags.map((t) => (
              <FilterChip
                key={t.id}
                label={t.name}
                active={tagId === t.id}
                onPress={() => setTagId(t.id)}
              />
            ))}
          </View>
        </ScrollView>
        <View style={styles.chipRow}>
          {(
            [
              ['-createdAt', 'Terbaru'],
              ['dueDate', 'Due ↑'],
              ['-dueDate', 'Due ↓'],
              ['priority', 'Priority'],
            ] as const
          ).map(([value, label]) => (
            <FilterChip
              key={value}
              label={label}
              active={sort === value}
              onPress={() => setSort(value)}
            />
          ))}
        </View>
      </View>

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
        {query.isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={sections}
            keyExtractor={(s) => s.key}
            ListHeaderComponent={listHeader}
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tambah todo"
            style={styles.fab}
            onPress={() => router.push('/(main)/todo-form')}
          >
            <SymbolView
              name="plus"
              size={28}
              tintColor={theme.colors.onPrimary}
            />
          </Pressable>
        )}
      </View>
    </Screen>
  );
}
