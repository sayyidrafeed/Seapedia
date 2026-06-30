import { Logo } from '@/components/shared/logo';

interface AuthCardProps {
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-xl border border-border shadow-surface">
        <div className="flex flex-col items-center">
          <Logo variant="wordmark" size="lg" className="mb-4" />
          <h2 className="text-center text-xl font-bold tracking-tight text-foreground">{title}</h2>
          <div className="mt-1.5 text-center text-xs text-muted-foreground">{subtitle}</div>
        </div>
        {children}
      </div>
    </div>
  );
}
