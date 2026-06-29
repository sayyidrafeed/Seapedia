import { Link } from '@tanstack/react-router';
import { Button } from '../ui/button';
import { LogOut } from 'lucide-react';

import { useAuth } from '@/lib/auth/context';

interface NavbarMobileProps {
  auth: ReturnType<typeof useAuth>;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  handleLogout: () => void;
  handleSelectRole: (role: 'admin' | 'seller' | 'buyer' | 'driver') => void;
  getRoleIcon: (role: string) => React.ReactNode;
}

export function NavbarMobile({
  auth,
  mobileMenuOpen,
  setMobileMenuOpen,
  handleLogout,
  handleSelectRole,
  getRoleIcon,
}: NavbarMobileProps) {
  if (!mobileMenuOpen) return null;

  return (
    <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-4">
      <nav className="flex flex-col gap-3 text-sm font-medium">
        <Link
          to="/"
          onClick={() => setMobileMenuOpen(false)}
          className="transition-colors hover:text-foreground/80 text-foreground py-1"
        >
          Home
        </Link>
        {auth.user && (
          <Link
            to="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className="transition-colors hover:text-foreground/80 text-foreground py-1"
          >
            Profile
          </Link>
        )}
      </nav>

      {auth.user ? (
        <div className="pt-4 border-t border-border space-y-3">
          <div className="text-sm font-medium text-muted-foreground">
            Logged in as <strong className="text-foreground">{auth.user.username}</strong>
          </div>

          {auth.activeRole && (
            <div className="flex items-center gap-2 text-xs font-semibold text-primary capitalize bg-primary/10 w-fit px-2.5 py-0.5 rounded-full">
              {getRoleIcon(auth.activeRole)}
              <span>Active: {auth.activeRole}</span>
            </div>
          )}

          {auth.roles.length > 1 && (
            <Link
              to="/select-role"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-medium text-primary hover:underline"
            >
              Switch Role
            </Link>
          )}

          {auth.roles.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Dashboards
              </div>
              {auth.roles.map((role: string) => (
                <button
                  key={role}
                  onClick={() => handleSelectRole(role as 'admin' | 'seller' | 'buyer' | 'driver')}
                  className={`w-full text-left py-2 px-3 text-xs hover:bg-accent rounded-md capitalize flex items-center gap-2 cursor-pointer bg-transparent border-none ${
                    auth.activeRole === role ? 'font-bold text-primary' : 'text-foreground'
                  }`}
                >
                  {getRoleIcon(role)}
                  <span>{role} Dashboard</span>
                </button>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full text-xs cursor-pointer mt-2"
          >
            <LogOut className="h-3 w-3 mr-1" />
            Logout
          </Button>
        </div>
      ) : (
        <div className="pt-4 border-t border-border flex flex-col gap-2">
          <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
            <Button variant="outline" size="sm" className="w-full text-xs cursor-pointer">
              Sign In
            </Button>
          </Link>
          <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full">
            <Button size="sm" className="w-full text-xs cursor-pointer">
              Register
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
