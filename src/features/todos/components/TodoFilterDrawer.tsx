/**
 * Filter drawer minimalis — chip Badge size sm (food-filter style).
 * Draft state; commit lewat "Terapkan". Akses hanya FAB filter.
 */
import { AppText, Badge, BottomSheet, Button } from '@/components/ui';
import { useAppTheme } from '@/context/ThemeContext';
import type { Category } from '@/features/categories/types';
import type { Tag } from '@/features/tags/types';
import type { TodosInfiniteFilters } from '@/features/todos/queries/useTodosInfinite';
import type { Priority } from '@/features/todos/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

export type StatusFilter = 'all' | 'active' | 'completed';

export type TodoFilterValues = {
  status: StatusFilter;
  priority: Priority | undefined;
  categoryId: string | undefined;
  tagId: string | undefined;
  sort: TodosInfiniteFilters['sort'];
  search: string;
};

export const DEFAULT_TODO_FILTERS: TodoFilterValues = {
  status: 'active',
  priority: undefined,
  categoryId: undefined,
  tagId: undefined,
  sort: '-createdAt',
  search: '',
};

export type TodoFilterDrawerProps = {
  visible: boolean;
  onClose: () => void;
  values: TodoFilterValues;
  onApply: (values: TodoFilterValues) => void;
  categories: Category[];
  tags: Tag[];
};

type ChipOption<T> = { value: T; label: string };

/**
 * Section + wrap Badge chips (size sm).
 */
function ChipGroup<T>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const styles = useThemedStyles((t) => ({
    section: { marginBottom: t.spacing.lg },
    title: {
      marginBottom: t.spacing.sm,
      fontWeight: '600' as const,
    },
    wrap: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: t.spacing.xs + 2,
    },
  }));

  if (options.length === 0) return null;

  return (
    <View style={styles.section}>
      <AppText variant="body" color="label" style={styles.title}>
        {title}
      </AppText>
      <View style={styles.wrap}>
        {options.map((opt) => (
          <Badge
            key={String(opt.label)}
            label={opt.label}
            size="sm"
            selected={Object.is(opt.value, value)}
            onPress={() => onChange(opt.value)}
          />
        ))}
      </View>
    </View>
  );
}

const STATUS_OPTIONS: ChipOption<StatusFilter>[] = [
  { value: 'all', label: 'SEMUA' },
  { value: 'active', label: 'AKTIF' },
  { value: 'completed', label: 'SELESAI' },
];

const PRIORITY_OPTIONS: ChipOption<Priority | undefined>[] = [
  { value: undefined, label: 'SEMUA' },
  { value: 'low', label: 'LOW' },
  { value: 'medium', label: 'MEDIUM' },
  { value: 'high', label: 'HIGH' },
];

const SORT_OPTIONS: ChipOption<NonNullable<TodosInfiniteFilters['sort']>>[] = [
  { value: '-createdAt', label: 'TERBARU' },
  { value: 'dueDate', label: 'TENGGAT ↑' },
  { value: '-dueDate', label: 'TENGGAT ↓' },
  { value: 'priority', label: 'PRIORITAS' },
];

export function countActiveTodoFilters(v: TodoFilterValues): number {
  let n = 0;
  if (v.status !== 'active') n += 1;
  if (v.priority) n += 1;
  if (v.categoryId) n += 1;
  if (v.tagId) n += 1;
  if (v.sort && v.sort !== '-createdAt') n += 1;
  if (v.search.trim()) n += 1;
  return n;
}

function filtersEqual(a: TodoFilterValues, b: TodoFilterValues): boolean {
  return (
    a.status === b.status &&
    a.priority === b.priority &&
    a.categoryId === b.categoryId &&
    a.tagId === b.tagId &&
    a.sort === b.sort &&
    a.search.trim() === b.search.trim()
  );
}

/**
 * Drawer filter chip — buka hanya dari FAB.
 */
export function TodoFilterDrawer({
  visible,
  onClose,
  values,
  onApply,
  categories,
  tags,
}: TodoFilterDrawerProps) {
  const { theme } = useAppTheme();
  const [draft, setDraft] = useState<TodoFilterValues>(values);

  const categoryOptions = useMemo<ChipOption<string | undefined>[]>(
    () => [
      { value: undefined, label: 'SEMUA' },
      ...categories.map((c) => ({
        value: c.id as string | undefined,
        label: c.name.toUpperCase(),
      })),
    ],
    [categories]
  );

  const tagOptions = useMemo<ChipOption<string | undefined>[]>(
    () => [
      { value: undefined, label: 'SEMUA' },
      ...tags.map((t) => ({
        value: t.id as string | undefined,
        label: t.name.toUpperCase(),
      })),
    ],
    [tags]
  );

  const hasChanges = !filtersEqual(draft, values);
  const hasActiveDraft = countActiveTodoFilters(draft) > 0;

  const styles = useThemedStyles((t) => ({
    header: {
      paddingHorizontal: t.spacing.lg,
      paddingBottom: t.spacing.md,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    body: {
      paddingHorizontal: t.spacing.lg,
      paddingBottom: t.spacing.md,
    },
    search: {
      borderRadius: t.radius.full,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm + 2,
      color: t.colors.label,
      backgroundColor: t.colors.tertiarySystemFill,
      minHeight: 44,
      marginBottom: t.spacing.lg,
      fontSize: t.fontSize.md,
    },
    footer: {
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.sm,
      paddingBottom: t.spacing.sm,
    },
    applyBtn: {
      width: '100%' as const,
      borderRadius: t.radius.full,
    },
  }));

  const patchDraft = (patch: Partial<TodoFilterValues>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeightRatio={0.88}>
      <View style={styles.header}>
        <AppText variant="headline">Filter</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hapus semua filter"
          onPress={() => setDraft(DEFAULT_TODO_FILTERS)}
          hitSlop={8}
          disabled={!hasActiveDraft}
          style={{ opacity: hasActiveDraft ? 1 : 0.4 }}
        >
          <AppText
            variant="caption"
            color="primary"
            style={{ fontWeight: '600' }}
          >
            Clear all
          </AppText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces
      >
        <TextInput
          value={draft.search}
          onChangeText={(search) => patchDraft({ search })}
          placeholder="Cari judul..."
          placeholderTextColor={theme.colors.placeholderText}
          style={styles.search}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Cari todo"
        />

        <ChipGroup
          title="Status"
          options={STATUS_OPTIONS}
          value={draft.status}
          onChange={(status) => patchDraft({ status })}
        />
        <ChipGroup
          title="Prioritas"
          options={PRIORITY_OPTIONS}
          value={draft.priority}
          onChange={(priority) => patchDraft({ priority })}
        />
        <ChipGroup
          title="Kategori"
          options={categoryOptions}
          value={draft.categoryId}
          onChange={(categoryId) => patchDraft({ categoryId })}
        />
        <ChipGroup
          title="Tag"
          options={tagOptions}
          value={draft.tagId}
          onChange={(tagId) => patchDraft({ tagId })}
        />
        <ChipGroup
          title="Urutan"
          options={SORT_OPTIONS}
          value={draft.sort ?? '-createdAt'}
          onChange={(sort) => patchDraft({ sort })}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Terapkan filter"
          variant="filled"
          onPress={() => {
            onApply(draft);
            onClose();
          }}
          disabled={!hasChanges}
          style={styles.applyBtn}
        />
      </View>
    </BottomSheet>
  );
}
