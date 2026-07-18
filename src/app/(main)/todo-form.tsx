/**
 * Form sheet create/edit todo (ADR-0008 presentation formSheet).
 * Params: id? — kalau ada = edit mode.
 */
import { AppText, Button, TextField } from '@/components/ui';
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
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
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
  const navigation = useNavigation();
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
    navigation.setOptions({ title: isEdit ? 'Edit Todo' : 'Todo Baru' });
  }, [isEdit, navigation]);

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
    content: {
      padding: t.spacing.lg,
      paddingBottom: t.spacing.xxl,
      gap: t.spacing.md,
    },
    label: { marginBottom: t.spacing.xs },
    row: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: t.spacing.xs,
    },
    chip: {
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xs,
      borderRadius: t.radius.full,
      backgroundColor: t.colors.tertiarySystemFill,
    },
    chipOn: { backgroundColor: t.colors.primary },
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

  if (loadingDetail) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <ActivityIndicator />
      </View>
    );
  }

  const pending = createTodo.isPending || updateTodo.isPending;

  return (
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
        <AppText variant="caption" color="secondaryLabel" style={styles.label}>
          Prioritas
        </AppText>
        <View style={styles.row}>
          {(['low', 'medium', 'high'] as Priority[]).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPriority(p)}
              style={[styles.chip, priority === p && styles.chipOn]}
            >
              <AppText
                variant="caption"
                color={priority === p ? 'onPrimary' : 'label'}
              >
                {p}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <AppText variant="caption" color="secondaryLabel" style={styles.label}>
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
              <Pressable
                key={opt.label}
                onPress={() => setDueDaysFromNow(opt.days)}
                style={[styles.chip, active && styles.chipOn]}
              >
                <AppText
                  variant="caption"
                  color={active ? 'onPrimary' : 'label'}
                >
                  {opt.label}
                </AppText>
              </Pressable>
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
        <AppText variant="caption" color="secondaryLabel" style={styles.label}>
          Kategori
        </AppText>
        <View style={styles.row}>
          <Pressable
            onPress={() => setCategoryId(null)}
            style={[styles.chip, categoryId == null && styles.chipOn]}
          >
            <AppText
              variant="caption"
              color={categoryId == null ? 'onPrimary' : 'label'}
            >
              Tidak ada
            </AppText>
          </Pressable>
          {categories.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setCategoryId(c.id)}
              style={[styles.chip, categoryId === c.id && styles.chipOn]}
            >
              <AppText
                variant="caption"
                color={categoryId === c.id ? 'onPrimary' : 'label'}
              >
                {c.name}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <AppText variant="caption" color="secondaryLabel" style={styles.label}>
          Tags (max 10)
        </AppText>
        <View style={styles.row}>
          {tags.map((t) => {
            const on = tagIds.includes(t.id);
            return (
              <Pressable
                key={t.id}
                onPress={() => {
                  setTagIds((prev) =>
                    on
                      ? prev.filter((x) => x !== t.id)
                      : prev.length >= 10
                        ? prev
                        : [...prev, t.id]
                  );
                }}
                style={[styles.chip, on && styles.chipOn]}
              >
                <AppText variant="caption" color={on ? 'onPrimary' : 'label'}>
                  {t.name}
                </AppText>
              </Pressable>
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
  );
}
