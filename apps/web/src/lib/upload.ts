import { toast } from 'sonner';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedMime = (typeof ALLOWED_MIMES)[number];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export interface PresignResponse {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
}

export async function uploadImageToR2(
  file: File,
  presignFn: (mimeType: AllowedMime) => Promise<{ data?: PresignResponse; error?: unknown }>,
): Promise<string | null> {
  // 1. Validation
  if (!ALLOWED_MIMES.includes(file.type as AllowedMime)) {
    toast.error('Format berkas tidak didukung. Hanya JPEG, PNG, dan WEBP yang diizinkan.');
    return null;
  }

  if (file.size > MAX_FILE_SIZE) {
    toast.error('Ukuran berkas melebihi 5 MB.');
    return null;
  }

  try {
    // 2. Fetch pre-signed URL using the SDK function passed from parent
    const { data, error } = await presignFn(file.type as AllowedMime);
    if (error || !data) {
      const errMsg = (error as { error?: string })?.error || 'Gagal membuat url pre-sign';
      throw new Error(errMsg);
    }

    const { uploadUrl, objectKey } = data;

    // 3. Upload directly to Cloudflare R2
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Gagal mengunggah berkas ke R2 storage');
    }

    return objectKey;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengunggah gambar';
    toast.error(errMsg);
    return null;
  }
}
