/**
 * Filter drawer todo — floating sheet + control per cardinality opsi.
 *
 * - 2 opsi → segmented
 * - 3+ opsi → list check
 * - Sheet inset (tidak nempel edge) lewat BottomSheet
 */
import {
  AppText,
  BottomSheet,
  Button,
  OptionControl,
  type OptionItem,
} from '@/components/ui';
import { useAppTheme } from '@/context/ThemeContext';
import type { Category } from '@/features/categories/types';
import type { Tag } from '@/features/tags/types';
import type { TodosInfiniteFilters } from '@/features/todos/queries/useTodosInfinite';
import type { Priority } from '@/features/todos/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

export type StatusFilter = 'all' | 'active' | 'completed';

export type TodoFilterValues = {
  status: StatusFilter;
  priority: Priority | undefined;
  categoryId: string | undefined;
  tagId: string | undefined;
  sort: TodosInfiniteFilters['sort'];
  search: string;
};

export type TodoFilterDrawerProps = {
  visible: boolean;
  onClose: () => void;
  values: TodoFilterValues;
  onChange: (patch: Partial<TodoFilterValues>) => void;
  onReset: () => void;
  categories: Category[];
  tags: Tag[];
};

const STATUS_OPTIONS: OptionItem<StatusFilter>[] = [
  { value: 'all', label: 'Semua' },
  { value: 'active', label: 'Aktif' },
  { value: 'completed', label: 'Selesai' },
];

const PRIORITY_OPTIONS: OptionItem<Priority | undefined>[] = [
  { value: undefined, label: 'Semua' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const SORT_OPTIONS: OptionItem<NonNullable<TodosInfiniteFilters['sort']>>[] = [
  { value: '-createdAt', label: 'Terbaru' },
  { value: 'dueDate', label: 'Tenggat ↑' },
  { value: '-dueDate', label: 'Tenggat ↓' },
  { value: 'priority', label: 'Prioritas' },
];

/**
 * Hitung filter non-default (badge FAB).
 */
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

/**
 * Drawer filter — buka dari floating control di Home.
 */
export function TodoFilterDrawer({
  visible,
  onClose,
  values,
  onChange,
  onReset,
  categories,
  tags,
}: TodoFilterDrawerProps) {
  const { theme } = useAppTheme();

  // "Semua" + items — cardinality menentukan segment vs list
  const categoryOptions = useMemo<OptionItem<string | undefined>[]>(
    () => [
      { value: undefined, label: 'Semua' },
      ...categories.map((c) => ({
        value: c.id as string | undefined,
        label: c.name,
      })),
    ],
    [categories]
  );

  const tagOptions = useMemo<OptionItem<string | undefined>[]>(
    () => [
      { value: undefined, label: 'Semua' },
      ...tags.map((t) => ({
        value: t.id as string | undefined,
        label: t.name,
      })),
    ],
    [tags]
  );

  const styles = useThemedStyles((t) => ({
    header: {
      paddingHorizontal: t.spacing.lg,
      paddingBottom: t.spacing.sm,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    body: {
      paddingHorizontal: t.spacing.lg,
      paddingBottom: t.spacing.md,
      gap: 0,
    },
    search: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.separator,
      borderRadius: t.radius.lg,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm,
      color: t.colors.label,
      backgroundColor: t.colors.tertiarySystemFill,
      minHeight: t.size.controlHeight,
      marginBottom: t.spacing.md,
      fontSize: t.fontSize.md,
    },
    footer: {
      flexDirection: 'row' as const,
      gap: t.spacing.sm,
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.sm,
      paddingBottom: t.spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.separator,
    },
  }));

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeightRatio={0.86}>
      <View style={styles.header}>
        <AppText variant="headline">Filter</AppText>
        {/* Satu aksi tutup — “Terapkan” redundant (filter live) */}
        <Button title="Selesai" variant="plain" onPress={onClose} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces
      >
        <TextInput
          value={values.search}
          onChangeText={(search) => onChange({ search })}
          placeholder="Cari judul todo..."
          placeholderTextColor={theme.colors.placeholderText}
          style={styles.search}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Cari todo"
        />

        {/* 3 opsi → list */}
        <OptionControl
          title="Status"
          options={STATUS_OPTIONS}
          value={values.status}
          onChange={(status) => onChange({ status })}
        />

        {/* 4 opsi → list */}
        <OptionControl
          title="Prioritas"
          options={PRIORITY_OPTIONS}
          value={values.priority}
          onChange={(priority) => onChange({ priority })}
        />

        {/* 2 total (Semua + 1 item) → segment; 3+ → list (auto) */}
        <OptionControl
          title="Kategori"
          options={categoryOptions}
          value={values.categoryId}
          onChange={(categoryId) => onChange({ categoryId })}
        />

        <OptionControl
          title="Tag"
          options={tagOptions}
          value={values.tagId}
          onChange={(tagId) => onChange({ tagId })}
        />

        <OptionControl
          title="Urutan"
          options={SORT_OPTIONS}
          value={values.sort ?? '-createdAt'}
          onChange={(sort) => onChange({ sort })}
        />
      </ScrollView>

      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Button title="Reset" variant="gray" onPress={onReset} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Selesai" variant="filled" onPress={onClose} />
        </View>
      </View>
    </BottomSheet>
  );
}
