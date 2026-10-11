import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { ImageUploader } from '@/components/ui/image-uploader';
import { uploadImageToR2, type AllowedMime, type PresignResponse } from '@/lib/upload';
import { presignUserAvatar, updateUserProfile } from '@/lib/api/generated';
import { toast } from 'sonner';

interface User {
  username: string;
  email: string;
  name: unknown;
  avatarUrl?: unknown;
  avatarKey?: unknown;
  createdAt: string;
}

interface ProfileDetailsProps {
  user: User;
}

export function ProfileDetails({ user }: ProfileDetailsProps) {
  const { t } = useTranslation();
  const auth = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarChange = async (file: File | null) => {
    if (!file) {
      // Handle removing avatar
      setIsUploading(true);
      const loadingToast = toast.loading('Menghapus avatar...');
      try {
        const { error } = await updateUserProfile({
          body: {
            avatarKey: null,
          },
        });

        if (error) {
          throw new Error((error as { error?: string })?.error || 'Gagal menghapus avatar');
        }

        toast.success('Avatar berhasil dihapus');
        await auth.refetchSession();
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan';
        toast.error(errMsg);
      } finally {
        toast.dismiss(loadingToast);
        setIsUploading(false);
      }
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading('Mengunggah avatar...');

    try {
      const objectKey = await uploadImageToR2(file, async (mimeType: AllowedMime) => {
        const res = await presignUserAvatar({
          body: { mimeType },
        });
        return res as { data?: PresignResponse; error?: unknown };
      });

      if (!objectKey) {
        setIsUploading(false);
        toast.dismiss(loadingToast);
        return;
      }

      const { error } = await updateUserProfile({
        body: {
          avatarKey: objectKey,
        },
      });

      if (error) {
        throw new Error((error as { error?: string })?.error || 'Gagal memperbarui profil');
      }

      toast.success('Avatar berhasil diperbarui');
      await auth.refetchSession();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal mengunggah avatar';
      toast.error(errMsg);
    } finally {
      toast.dismiss(loadingToast);
      setIsUploading(false);
    }
  };

  const avatarVal = (user.avatarUrl as string) || null;

  return (
    <div className="md:col-span-2 bg-card border border-border p-6 rounded-lg shadow-sm flex flex-col md:flex-row gap-6 items-start">
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Avatar
        </span>
        <ImageUploader
          value={avatarVal}
          onChange={handleAvatarChange}
          disabled={isUploading}
          aspectRatio="avatar"
        />
      </div>

      <div className="flex-1 w-full space-y-6">
        <h2 className="text-xl font-bold border-b border-border pb-3">
          {t('profile.personalDetails')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              {t('profile.username')}
            </span>
            <p className="text-foreground font-medium mt-1">{user.username}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              {t('profile.email')}
            </span>
            <p className="text-foreground font-medium mt-1">{user.email}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              {t('profile.displayName')}
            </span>
            <p className="text-foreground font-medium mt-1">
              {(user.name as string) || t('profile.notSet')}
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              {t('profile.joinedDate')}
            </span>
            <p className="text-foreground font-medium mt-1">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
