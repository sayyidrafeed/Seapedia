import { useTranslation } from 'react-i18next';

interface User {
  username: string;
  email: string;
  name: unknown;
  createdAt: string;
}

interface ProfileDetailsProps {
  user: User;
}

export function ProfileDetails({ user }: ProfileDetailsProps) {
  const { t } = useTranslation();

  return (
    <div className="md:col-span-2 bg-card border border-border p-6 rounded-lg shadow-sm space-y-6">
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
  );
}
