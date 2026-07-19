/**
 * Create/edit todo di floating SheetScaffold (bukan stack screen).
 *
 * - todoId null/undefined → create
 * - todoId string → load detail lalu edit
 * - Close / scrim → discard draft (D1); parent remount via key
 */
import {
  AppText,
  Badge,
  Button,
  SheetScaffold,
  TextField,
} from '@/components/ui';
import { useCategories } from '@/features/categories/queries/useCategories';
import { useTags } from '@/features/tags/queries/useTags';
import { todosApi } from '@/features/todos/api/todos.api';
import {
  useCreateTodo,
  useUpdateTodo,
} from '@/features/todos/queries/useTodoMutations';
import type { Priority } from '@/features/todos/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, View } from 'react-native';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, 'Judul wajib').max(200),
  description: z.string().max(2000).optional(),
});

type FormValues = z.infer<typeof schema>;

export type TodoFormDrawerProps = {
  visible: boolean;
  onClose: () => void;
  /** Ada id = edit mode. */
  todoId?: string | null;
};

/**
 * Form todo dalam floating sheet.
 * Create: TodoCreateProvider (tab bar +). Edit: mount di list screen.
 */
export function TodoFormDrawer({
  visible,
  onClose,
  todoId,
}: TodoFormDrawerProps) {
  const isEdit = Boolean(todoId);
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();

  const [priority, setPriority] = useState<Priority>('medium');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string | null>(null);
  // Remount parent key → create start false; edit start true sampai fetch selesai
  const [loadingDetail, setLoadingDetail] = useState(() => Boolean(todoId));

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '' },
    mode: 'onChange',
  });

  useEffect(() => {
    if (!todoId) return;
    let cancelled = false;
    (async () => {
      try {
        const todo = await todosApi.getById(todoId);
        if (cancelled) return;
        reset({
          title: todo.title,
          description: todo.description ?? '',
        });
        setPriority(todo.priority);
        setCategoryId(todo.categoryId);
        setTagIds(todo.tags.map((t) => t.id));
        setDueDate(todo.dueDate);
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [todoId, reset]);

  const styles = useThemedStyles((t) => ({
    fields: {
      gap: t.spacing.md,
    },
    label: { marginBottom: t.spacing.xs },
    row: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: t.spacing.xs + 2,
    },
    loadingBox: {
      paddingVertical: t.spacing.xxl,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    submitBtn: {
      width: '100%' as const,
      borderRadius: t.radius.full,
    },
  }));

  const setDueDaysFromNow = (days: number | null) => {
    if (days == null) {
      setDueDate(null);
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(12, 0, 0, 0);
    setDueDate(d.toISOString());
  };

  const onSubmit = (values: FormValues) => {
    const body = {
      title: values.title,
      description: values.description || undefined,
      priority,
      categoryId,
      tagIds: tagIds.slice(0, 10),
      dueDate,
    };
    if (isEdit && todoId) {
      updateTodo.mutate({ id: todoId, body }, { onSuccess: () => onClose() });
    } else {
      createTodo.mutate(body, { onSuccess: () => onClose() });
    }
  };

  const pending = createTodo.isPending || updateTodo.isPending;

  return (
    <SheetScaffold
      visible={visible}
      onClose={onClose}
      title={isEdit ? 'Edit Todo' : 'Todo Baru'}
      subtitle={isEdit ? 'Perbarui detail tugas' : 'Tambah tugas baru'}
      maxHeightRatio={0.92}
      footer={
        loadingDetail ? null : (
          <Button
            title={isEdit ? 'Simpan' : 'Tambah'}
            variant="filled"
            loading={pending}
            disabled={!isValid || pending}
            onPress={handleSubmit(onSubmit)}
            style={styles.submitBtn}
          />
        )
      }
    >
      {loadingDetail ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator />
        </View>
      ) : (
        <View style={styles.fields}>
          <TextField
            control={control}
            name="title"
            label="Judul"
            placeholder="Apa yang perlu dikerjakan?"
            error={errors.title?.message}
          />
          <TextField
            control={control}
            name="description"
            label="Deskripsi"
            placeholder="Opsional"
            error={errors.description?.message}
            multiline
          />

          <View>
            <AppText
              variant="caption"
              color="secondaryLabel"
              style={styles.label}
            >
              Prioritas
            </AppText>
            <View style={styles.row}>
              {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                <Badge
                  key={p}
                  label={p}
                  size="sm"
                  selected={priority === p}
                  onPress={() => setPriority(p)}
                />
              ))}
            </View>
          </View>

          <View>
            <AppText
              variant="caption"
              color="secondaryLabel"
              style={styles.label}
            >
              Tenggat
            </AppText>
            <View style={styles.row}>
              {[
                { label: 'Tidak ada', days: null as number | null },
                { label: 'Hari ini', days: 0 },
                { label: '+1 hari', days: 1 },
                { label: '+7 hari', days: 7 },
              ].map((opt) => {
                const active =
                  opt.days == null
                    ? dueDate == null
                    : dueDate != null &&
                      Math.abs(
                        new Date(dueDate).setHours(0, 0, 0, 0) -
                          new Date().setHours(0, 0, 0, 0) -
                          opt.days * 86400000
                      ) < 86400000;
                return (
                  <Badge
                    key={opt.label}
                    label={opt.label}
                    size="sm"
                    selected={active}
                    onPress={() => setDueDaysFromNow(opt.days)}
                  />
                );
              })}
            </View>
            {dueDate ? (
              <AppText variant="caption" color="secondaryLabel">
                {new Date(dueDate).toLocaleString()}
              </AppText>
            ) : null}
          </View>

          <View>
            <AppText
              variant="caption"
              color="secondaryLabel"
              style={styles.label}
            >
              Kategori
            </AppText>
            <View style={styles.row}>
              <Badge
                label="Tidak ada"
                size="sm"
                selected={categoryId == null}
                onPress={() => setCategoryId(null)}
              />
              {categories.map((c) => (
                <Badge
                  key={c.id}
                  label={c.name}
                  size="sm"
                  selected={categoryId === c.id}
                  onPress={() => setCategoryId(c.id)}
                />
              ))}
            </View>
          </View>

          <View>
            <AppText
              variant="caption"
              color="secondaryLabel"
              style={styles.label}
            >
              Tags (max 10)
            </AppText>
            <View style={styles.row}>
              {tags.map((t) => {
                const on = tagIds.includes(t.id);
                return (
                  <Badge
                    key={t.id}
                    label={t.name}
                    size="sm"
                    selected={on}
                    onPress={() => {
                      setTagIds((prev) =>
                        on
                          ? prev.filter((x) => x !== t.id)
                          : prev.length >= 10
                            ? prev
                            : [...prev, t.id]
                      );
                    }}
                  />
                );
              })}
            </View>
          </View>
        </View>
      )}
    </SheetScaffold>
  );
}
