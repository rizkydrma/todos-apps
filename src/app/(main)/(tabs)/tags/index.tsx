/**
 * Tab Tags: list untuk semua user; form/edit/hapus hanya admin.
 */
import {
  AppText,
  Button,
  PageHeaderChrome,
  PageHeaderLargeTitle,
  Screen,
  TextField,
  usePageHeaderCollapse,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import {
  useCreateTag,
  useDeleteTag,
  useTags,
  useUpdateTag,
} from '@/features/tags/queries/useTags';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { confirmDestructive } from '@/lib/confirm';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Nama wajib'),
  color: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export default function TagsScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { scrollY, scrollHandler } = usePageHeaderCollapse();
  const { data = [], isLoading, refetch } = useTags();
  const create = useCreateTag();
  const update = useUpdateTag();
  const remove = useDeleteTag();
  const [editId, setEditId] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', color: '#EF4444' },
  });

  const styles = useThemedStyles((t) => ({
    content: { padding: t.spacing.md, flexGrow: 1 },
    row: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: t.spacing.md,
      backgroundColor: t.colors.secondarySystemGroupedBackground,
      borderRadius: t.radius.lg,
      marginBottom: t.spacing.sm,
    },
    form: { marginBottom: t.spacing.lg, gap: t.spacing.sm },
  }));

  const onSubmit = (values: Form) => {
    if (!isAdmin) return;
    if (editId) {
      update.mutate(
        { id: editId, body: { name: values.name, color: values.color } },
        {
          onSuccess: () => {
            setEditId(null);
            reset({ name: '', color: '#EF4444' });
          },
        }
      );
    } else {
      create.mutate(
        { name: values.name, color: values.color },
        { onSuccess: () => reset({ name: '', color: '#EF4444' }) }
      );
    }
  };

  const subtitle = isAdmin ? 'Kelola tag todo' : 'Tag untuk label todo';

  return (
    <Screen background="systemGroupedBackground" safe={{ top: false }}>
      <PageHeaderChrome title="Tags" scrollY={scrollY} />
      <Animated.FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.content}
        refreshing={isLoading}
        onRefresh={() => refetch()}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View>
            <PageHeaderLargeTitle title="Tags" subtitle={subtitle} />
            {isAdmin ? (
              <View style={styles.form}>
                <AppText variant="headline">
                  {editId ? 'Edit tag' : 'Tambah tag'}
                </AppText>
                <TextField control={control} name="name" label="Nama" />
                <TextField control={control} name="color" label="Warna hex" />
                <Button
                  title={editId ? 'Simpan' : 'Tambah'}
                  onPress={handleSubmit(onSubmit)}
                  loading={create.isPending || update.isPending}
                  disabled={!formState.isValid}
                />
                {editId ? (
                  <Button
                    title="Batal edit"
                    variant="plain"
                    onPress={() => {
                      setEditId(null);
                      reset({ name: '', color: '#EF4444' });
                    }}
                  />
                ) : null}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <AppText color="secondaryLabel">Belum ada tag</AppText>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <AppText variant="body">{item.name}</AppText>
              <AppText variant="caption" color="secondaryLabel">
                {item.color ?? '—'}
              </AppText>
            </View>
            {isAdmin ? (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable
                  onPress={() => {
                    setEditId(item.id);
                    reset({ name: item.name, color: item.color ?? '' });
                  }}
                >
                  <AppText color="primary">Edit</AppText>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    const ok = await confirmDestructive({
                      title: 'Hapus tag?',
                      message: item.name,
                    });
                    if (ok) remove.mutate(item.id);
                  }}
                >
                  <AppText color="destructive">Hapus</AppText>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}
      />
    </Screen>
  );
}
