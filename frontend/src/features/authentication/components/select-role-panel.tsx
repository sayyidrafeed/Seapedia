import { useAuth } from '@/lib/auth/context';
import { useNavigate } from '@tanstack/react-router';

export function SelectRolePanel() {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSelect = async (role: 'admin' | 'seller' | 'buyer' | 'driver') => {
    try {
      await auth.selectRole(role);
      navigate({ to: `/dashboard/${role}` });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to select role:', err);
    }
  };

  return (
    <div className="mt-6 space-y-3">
      {auth.roles.map((role) => (
        <button
          key={role}
          onClick={() => handleSelect(role as 'admin' | 'seller' | 'buyer' | 'driver')}
          className="flex w-full items-center justify-between rounded-md border border-input bg-background hover:bg-muted px-4 py-3.5 text-sm font-semibold text-foreground transition-all capitalize shadow-sm cursor-pointer"
        >
          <span>{role} Dashboard</span>
          {auth.activeRole === role && (
            <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
}
