/**
 * Form sheet create/edit todo (ADR-0008 presentation modal).
 * Params: id? — kalau ada = edit mode.
 * PageHeader konsisten dengan tab roots (native stack header off).
 */
import {
  AppText,
  Badge,
  Button,
  PageHeader,
  PageHeaderBackButton,
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, 'Judul wajib').max(200),
  description: z.string().max(2000).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function TodoFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const router = useRouter();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();

  const [priority, setPriority] = useState<Priority>('medium');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(isEdit);

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
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const todo = await todosApi.getById(id);
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
  }, [id, reset]);

  const styles = useThemedStyles((t) => ({
    root: {
      flex: 1,
      backgroundColor: t.colors.systemBackground,
    },
    content: {
      padding: t.spacing.lg,
      paddingTop: t.spacing.sm,
      paddingBottom: t.spacing.xxl,
      gap: t.spacing.md,
    },
    label: { marginBottom: t.spacing.xs },
    row: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: t.spacing.xs + 2,
    },
    loading: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: t.colors.systemBackground,
    },
  }));

  const onSubmit = (values: FormValues) => {
    const body = {
      title: values.title,
      description: values.description || undefined,
      priority,
      categoryId,
      tagIds: tagIds.slice(0, 10),
      dueDate,
    };
    if (isEdit && id) {
      updateTodo.mutate({ id, body }, { onSuccess: () => router.back() });
    } else {
      createTodo.mutate(body, { onSuccess: () => router.back() });
    }
  };

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

  // HIG 2-baris: chrome (back) + large title; back = chevron + press spring
  const header = (
    <PageHeader
      title={isEdit ? 'Edit Todo' : 'Todo Baru'}
      subtitle={isEdit ? 'Perbarui detail tugas' : 'Tambah tugas baru'}
      safeTop
      leading={<PageHeaderBackButton onPress={() => router.back()} />}
    />
  );

  if (loadingDetail) {
    return (
      <View style={styles.loading}>
        {header}
        <ActivityIndicator style={{ marginTop: 40 }} />
      </View>
    );
  }

  const pending = createTodo.isPending || updateTodo.isPending;

  return (
    <View style={styles.root}>
      {header}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
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

        <Button
          title={isEdit ? 'Simpan' : 'Tambah'}
          variant="filled"
          loading={pending}
          disabled={!isValid || pending}
          onPress={handleSubmit(onSubmit)}
        />
      </ScrollView>
    </View>
  );
}
