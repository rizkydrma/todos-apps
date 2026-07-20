/**
 * Edit Profile (main stack): ubah nama + avatar (upload R2 saat Save).
 *
 * Draft lokal dulu — cancel mudah; dirty back → confirmDestructive.
 * Avatar: gallery/camera + native 1:1 crop; compress 512/JPEG saat Save.
 */
import {
  AppText,
  BottomSheet,
  Button,
  InitialsAvatar,
  Screen,
  TextField,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useUpdateProfile } from '@/features/auth/hooks/useUpdateProfile';
import {
  AVATAR_UPLOAD_FOLDER,
  prepareAvatarImage,
} from '@/features/auth/lib/prepareAvatarImage';
import type { UpdateMeBody } from '@/features/auth/types';
import { uploadsApi } from '@/features/uploads/api/uploads.api';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getApiErrorMessage } from '@/lib/api-error';
import { confirmDestructive } from '@/lib/confirm';
import { toast } from '@/lib/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { ActivityIndicator, Pressable, View } from 'react-native';
import z from 'zod';

const editSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama tidak boleh kosong')
    .max(100, 'Maksimal 100 karakter'),
});

type EditFormValues = z.infer<typeof editSchema>;

/** Draft avatar di form — belum di-commit ke server sampai Save. */
type AvatarDraft =
  | { kind: 'unchanged' }
  | { kind: 'local'; uri: string; width: number; height: number }
  | { kind: 'cleared' };

const pickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 1,
};

export default function ProfileEditScreen() {
  const { user, updateUser } = useAuth();
  const { theme } = useAppTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const updateProfile = useUpdateProfile();
  const iconColor = theme.colors.label;
  const [avatarDraft, setAvatarDraft] = useState<AvatarDraft>({
    kind: 'unchanged',
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savingExtra, setSavingExtra] = useState(false);
  /** Cegah double-prompt discard saat user sudah konfirmasi leave. */
  const allowLeaveRef = useRef(false);

  const initialName = user?.name ?? '';

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: initialName },
    mode: 'onChange',
  });

  const nameValue = useWatch({ control, name: 'name' }) ?? '';

  const nameDirty = nameValue.trim() !== initialName.trim();
  const avatarDirty = avatarDraft.kind !== 'unchanged';
  const isDirty = nameDirty || avatarDirty;
  const canSave =
    isDirty && isValid && !updateProfile.isPending && !savingExtra;

  const previewUri = useMemo(() => {
    if (avatarDraft.kind === 'local') return avatarDraft.uri;
    if (avatarDraft.kind === 'cleared') return null;
    return user?.avatarUrl ?? null;
  }, [avatarDraft, user?.avatarUrl]);

  const showRemoveOption =
    avatarDraft.kind === 'local' ||
    (avatarDraft.kind === 'unchanged' && Boolean(user?.avatarUrl));

  const styles = useThemedStyles((t) => ({
    content: {
      padding: t.spacing.lg,
      gap: t.spacing.lg,
    },
    avatarBlock: {
      alignItems: 'center' as const,
      gap: t.spacing.md,
      paddingVertical: t.spacing.md,
    },
    avatarPress: {
      alignItems: 'center' as const,
      gap: t.spacing.sm,
    },
    sheetBody: {
      paddingHorizontal: t.spacing.lg,
      paddingBottom: t.spacing.md,
      gap: t.spacing.sm,
    },
    sheetTitle: {
      marginBottom: t.spacing.xs,
    },
    sheetRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.md,
      paddingVertical: t.spacing.md,
      paddingHorizontal: t.spacing.sm,
      borderRadius: t.radius.lg,
      backgroundColor: t.colors.secondarySystemGroupedBackground,
    },
  }));

  const confirmLeaveIfDirty = useCallback(async (): Promise<boolean> => {
    if (!isDirty || allowLeaveRef.current) return true;
    const ok = await confirmDestructive({
      title: 'Buang perubahan?',
      message: 'Perubahan nama atau foto belum disimpan.',
      confirmLabel: 'Buang',
      cancelLabel: 'Lanjutkan edit',
    });
    return ok;
  }, [isDirty]);

  // Intercept gesture/header back saat form dirty
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RN navigation event payload
    const unsub = navigation.addListener('beforeRemove' as any, (e: any) => {
      if (!isDirty || allowLeaveRef.current) return;
      e.preventDefault();
      void (async () => {
        const ok = await confirmLeaveIfDirty();
        if (ok) {
          allowLeaveRef.current = true;
          navigation.dispatch(e.data.action);
        }
      })();
    });
    return unsub;
  }, [navigation, isDirty, confirmLeaveIfDirty]);

  const applyPickedAsset = (asset: ImagePicker.ImagePickerAsset) => {
    if (!asset.uri) return;
    setAvatarDraft({
      kind: 'local',
      uri: asset.uri,
      width: asset.width ?? 0,
      height: asset.height ?? 0,
    });
    setPickerOpen(false);
  };

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error({
        title: 'Izin diperlukan',
        message: 'Izinkan akses galeri untuk memilih foto profil.',
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
    if (!result.canceled && result.assets[0]) {
      applyPickedAsset(result.assets[0]);
    } else {
      setPickerOpen(false);
    }
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      toast.error({
        title: 'Izin diperlukan',
        message: 'Izinkan kamera untuk mengambil foto profil.',
      });
      return;
    }
    const result = await ImagePicker.launchCameraAsync(pickerOptions);
    if (!result.canceled && result.assets[0]) {
      applyPickedAsset(result.assets[0]);
    } else {
      setPickerOpen(false);
    }
  };

  const onRemoveAvatar = () => {
    setAvatarDraft({ kind: 'cleared' });
    setPickerOpen(false);
  };

  const onSave = handleSubmit(async (values) => {
    if (!user || !canSave) return;

    setSavingExtra(true);
    try {
      const body: UpdateMeBody = {};

      if (nameDirty) {
        body.name = values.name.trim();
      }

      if (avatarDraft.kind === 'local') {
        // Compress dulu → presign → PUT R2 → key untuk PATCH
        let prepared;
        try {
          prepared = await prepareAvatarImage(avatarDraft.uri, {
            width: avatarDraft.width,
            height: avatarDraft.height,
          });
          const presigned = await uploadsApi.getSingleUrl({
            fileName: prepared.fileName,
            fileType: prepared.fileType,
            fileSize: prepared.fileSize,
            folder: AVATAR_UPLOAD_FOLDER,
          });
          await uploadsApi.putToPresignedUrl({
            uploadUrl: presigned.uploadUrl,
            body: prepared.blob,
            contentType: prepared.fileType,
          });
          body.avatarKey = presigned.key;
        } catch (e) {
          // Gagal di pipeline upload — jangan PATCH; mutation belum jalan
          toast.error({ title: 'Gagal', message: getApiErrorMessage(e) });
          return;
        }
      } else if (avatarDraft.kind === 'cleared') {
        body.avatarKey = null;
      }

      // Tidak ada field berubah (race) — jangan PATCH kosong
      if (body.name === undefined && body.avatarKey === undefined) {
        return;
      }

      try {
        await updateProfile.mutateAsync({
          body,
          onUserUpdated: updateUser,
        });
      } catch {
        // onError mutation sudah toast
        return;
      }

      allowLeaveRef.current = true;
      router.back();
    } finally {
      setSavingExtra(false);
    }
  });

  const busy = updateProfile.isPending || savingExtra;

  if (!user) {
    return (
      <Screen background="systemGroupedBackground" safe={{ top: false }}>
        <View style={styles.content}>
          <AppText color="secondaryLabel">Sesi tidak tersedia.</AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      background="systemGroupedBackground"
      safe={{ top: false }}
      keyboard
      scroll
      dismissKeyboardOnPress
    >
      <View style={styles.content}>
        <View style={styles.avatarBlock}>
          <Pressable
            onPress={() => setPickerOpen(true)}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Ubah foto profil"
            style={styles.avatarPress}
          >
            <InitialsAvatar
              name={nameValue || user.name}
              email={user.email}
              imageUri={previewUri}
              size={96}
            />
            <AppText variant="link" color="systemBlue">
              Ubah foto
            </AppText>
          </Pressable>
        </View>

        <TextField
          control={control}
          name="name"
          label="Nama"
          placeholder="Nama tampilan"
          autoCapitalize="words"
          autoCorrect={false}
          error={errors.name?.message}
          editable={!busy}
        />

        <Button
          title="Simpan"
          onPress={() => void onSave()}
          loading={busy}
          disabled={!canSave}
        />
      </View>

      <BottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)}>
        <View style={styles.sheetBody}>
          <AppText variant="headline" style={styles.sheetTitle}>
            Foto profil
          </AppText>

          <Pressable
            onPress={() => void pickFromLibrary()}
            style={styles.sheetRow}
            accessibilityRole="button"
            accessibilityLabel="Pilih dari galeri"
          >
            <ImageIcon size={22} color={iconColor} />
            <AppText variant="body">Pilih dari galeri</AppText>
          </Pressable>

          <Pressable
            onPress={() => void pickFromCamera()}
            style={styles.sheetRow}
            accessibilityRole="button"
            accessibilityLabel="Ambil foto"
          >
            <Camera size={22} color={iconColor} />
            <AppText variant="body">Ambil foto</AppText>
          </Pressable>

          {showRemoveOption ? (
            <Pressable
              onPress={onRemoveAvatar}
              style={styles.sheetRow}
              accessibilityRole="button"
              accessibilityLabel="Hapus foto"
            >
              <Trash2 size={22} color={theme.colors.systemRed} />
              <AppText variant="body" color="systemRed">
                Hapus foto
              </AppText>
            </Pressable>
          ) : null}

          {busy ? <ActivityIndicator /> : null}
        </View>
      </BottomSheet>
    </Screen>
  );
}
