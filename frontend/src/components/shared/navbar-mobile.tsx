import { Link } from '@tanstack/react-router';
import { Button } from '../ui/button';
import { LogOut, Languages } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '../ui/drawer';
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation();
  return (
    <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <DrawerContent className="p-6 pb-8">
        <div className="max-w-md mx-auto w-full">
          <DrawerHeader className="px-0 pt-0 text-left">
            <DrawerTitle className="text-xl font-bold">{t('navbar.menu')}</DrawerTitle>
            <DrawerDescription>{t('navbar.menuDescription')}</DrawerDescription>
          </DrawerHeader>

          <div className="mt-4 space-y-6">
            <nav className="flex flex-col gap-3 text-sm font-medium">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="transition-colors hover:text-foreground/80 text-foreground py-1"
              >
                {t('navbar.home')}
              </Link>
              {auth.user && (
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="transition-colors hover:text-foreground/80 text-foreground py-1"
                >
                  {t('navbar.profile')}
                </Link>
              )}
              {auth.activeRole === 'buyer' && (
                <Link
                  to="/dashboard/buyer/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="transition-colors hover:text-foreground/80 text-foreground py-1 flex items-center justify-between"
                >
                  <span>{t('navbar.cart')}</span>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  i18n.changeLanguage(i18n.language === 'id' ? 'en' : 'id');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-start gap-2 w-full text-left px-0 hover:bg-transparent font-bold cursor-pointer text-sm py-1"
              >
                <Languages className="h-4 w-4 text-muted-foreground" />
                <span className="uppercase">
                  {i18n.language === 'id' ? 'Bahasa Indonesia (ID)' : 'English (EN)'}
                </span>
              </Button>
            </nav>

            {auth.user ? (
              <div className="pt-4 border-t border-border space-y-3">
                <div className="text-sm font-medium text-muted-foreground">
                  {t('navbar.loggedInAs')}{' '}
                  <strong className="text-foreground">{auth.user.username}</strong>
                </div>

                {auth.activeRole && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary capitalize bg-primary/10 w-fit px-2.5 py-0.5 rounded-full">
                    {getRoleIcon(auth.activeRole)}
                    <span>
                      {t('navbar.activeRoleLabel', { role: t(`role.${auth.activeRole}`) })}
                    </span>
                  </div>
                )}

                {auth.roles.length > 1 && (
                  <Link
                    to="/select-role"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-xs font-medium text-primary hover:underline"
                  >
                    {t('navbar.switchRole')}
                  </Link>
                )}

                {auth.roles.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('navbar.dashboardsHeader')}
                    </div>
                    {auth.roles.map((role: string) => (
                      <button
                        key={role}
                        onClick={() =>
                          handleSelectRole(role as 'admin' | 'seller' | 'buyer' | 'driver')
                        }
                        className={`w-full text-left py-2 px-3 text-xs hover:bg-muted rounded-md capitalize flex items-center gap-2 cursor-pointer bg-transparent border-none ${
                          auth.activeRole === role ? 'font-bold text-primary' : 'text-foreground'
                        }`}
                      >
                        {getRoleIcon(role)}
                        <span>{t('navbar.dashboardWithRole', { context: role })}</span>
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
                  {t('navbar.logout')}
                </Button>
              </div>
            ) : (
              <div className="pt-4 border-t border-border flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-xs cursor-pointer">
                    {t('navbar.signIn')}
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full">
                  <Button size="sm" className="w-full text-xs cursor-pointer">
                    {t('navbar.register')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
