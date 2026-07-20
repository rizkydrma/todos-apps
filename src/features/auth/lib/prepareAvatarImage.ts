/**
 * Post-process foto avatar setelah native crop (picker allowsEditing 1:1).
 * Resize max side 512 + JPEG quality 0.8 — hemat bandwidth & R2, cukup tajam di UI.
 */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** Sisi terpanjang avatar setelah compress (px). */
export const AVATAR_MAX_SIDE = 512;
/** Kualitas JPEG 0–1. */
export const AVATAR_JPEG_QUALITY = 0.8;
export const AVATAR_MIME = 'image/jpeg' as const;
export const AVATAR_UPLOAD_FOLDER = 'avatars' as const;

export type PreparedAvatar = {
  /** file:// URI hasil manipulasi (JPEG). */
  uri: string;
  fileName: string;
  fileType: typeof AVATAR_MIME;
  fileSize: number;
  /** Blob siap PUT ke presigned URL. */
  blob: Blob;
};

/**
 * Resize (hanya jika sisi terpanjang > 512) + simpan JPEG, lalu baca Blob.
 * Dipanggil di Save, bukan saat pick (draft hanya simpan URI lokal).
 *
 * @param localUri - file:// dari image picker
 * @param sourceSize - width/height asset (hindari upscale foto kecil)
 */
export async function prepareAvatarImage(
  localUri: string,
  sourceSize?: { width: number; height: number }
): Promise<PreparedAvatar> {
  const context = ImageManipulator.manipulate(localUri);
  const longest = Math.max(sourceSize?.width ?? 0, sourceSize?.height ?? 0);
  // Tanpa ukuran sumber: tetap cap 512 (aman untuk foto kamera).
  if (!longest || longest > AVATAR_MAX_SIDE) {
    // Hanya set width; height mengikuti aspect (1:1 dari crop native).
    context.resize({ width: AVATAR_MAX_SIDE });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    compress: AVATAR_JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });

  const res = await fetch(saved.uri);
  const blob = await res.blob();
  const fileSize = blob.size;
  if (!fileSize || fileSize <= 0) {
    throw new Error('Gagal membaca ukuran file avatar');
  }

  return {
    uri: saved.uri,
    fileName: `avatar_${Date.now()}.jpg`,
    fileType: AVATAR_MIME,
    fileSize,
    blob,
  };
}
