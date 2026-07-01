import { Link } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/context';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBuyerCartOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Menu, X, Languages } from 'lucide-react';
import { Button } from '../ui/button';
import { Logo } from './logo';
import { UserMenu } from './user-menu';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '../ui/drawer';

export function GlobalNavbar() {
  const { t, i18n } = useTranslation();
  const auth = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: cart } = useQuery({
    ...getBuyerCartOptions(),
    enabled: auth.activeRole === 'buyer',
  });

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'id' ? 'en' : 'id');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Brand/Logo */}
        <div className="flex items-center gap-6">
          <Link to="/" className="transition-opacity hover:opacity-90">
            <Logo variant="wordmark" size="md" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/" className="transition-colors hover:text-foreground/80 text-foreground">
              {t('navbar.home')}
            </Link>
            {auth.user && auth.activeRole && (
              <Link
                to={
                  auth.activeRole === 'admin'
                    ? '/dashboard/admin'
                    : auth.activeRole === 'seller'
                      ? '/dashboard/seller'
                      : auth.activeRole === 'driver'
                        ? '/dashboard/driver'
                        : '/dashboard/buyer'
                }
                className="transition-colors hover:text-foreground/80 text-muted-foreground"
              >
                {t('navbar.dashboard')}
              </Link>
            )}
          </nav>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center gap-4">
          {/* Cart Icon (Buyers only) */}
          {auth.activeRole === 'buyer' && (
            <Link
              to="/dashboard/buyer/cart"
              className="relative p-2 text-foreground hover:bg-muted rounded-full transition-colors focus:outline-none"
              title={t('navbar.cart')}
            >
              <ShoppingCart className="h-5 w-5" />
              {cart && cart.totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cart.totalItems}
                </span>
              )}
            </Link>
          )}

          {/* Authentication / User Dropdown */}
          {auth.isLoading ? (
            <span className="text-xs text-muted-foreground animate-pulse mr-2">
              {t('navbar.loading')}
            </span>
          ) : auth.user ? (
            <UserMenu />
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-xs cursor-pointer">
                  {t('navbar.signIn')}
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="text-xs cursor-pointer">
                  {t('navbar.register')}
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle (Unauthenticated or Navigation Drawer) */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-foreground hover:bg-accent rounded-md cursor-pointer focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Only for public/non-dashboard links, settings, or guest navigation) */}
      <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DrawerContent className="p-6 pb-8">
          <div className="max-w-md mx-auto w-full">
            <DrawerHeader className="px-0 pt-0 text-left">
              <DrawerTitle className="text-xl font-bold">{t('navbar.menu')}</DrawerTitle>
              <DrawerDescription>{t('navbar.menuDescription')}</DrawerDescription>
            </DrawerHeader>

            <div className="mt-4 space-y-6">
              <nav className="flex flex-col gap-4 text-sm font-semibold">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="transition-colors hover:text-foreground/80 text-foreground py-1"
                >
                  {t('navbar.home')}
                </Link>
                {auth.user && auth.activeRole && (
                  <Link
                    to={
                      auth.activeRole === 'admin'
                        ? '/dashboard/admin'
                        : auth.activeRole === 'seller'
                          ? '/dashboard/seller'
                          : auth.activeRole === 'driver'
                            ? '/dashboard/driver'
                            : '/dashboard/buyer'
                    }
                    onClick={() => setMobileMenuOpen(false)}
                    className="transition-colors hover:text-foreground/80 text-foreground py-1"
                  >
                    {t('navbar.dashboard')}
                  </Link>
                )}

                <button
                  onClick={() => {
                    toggleLanguage();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full text-left px-0 hover:bg-transparent font-bold cursor-pointer text-sm py-1 border-none bg-transparent text-foreground"
                >
                  <Languages className="h-4 w-4 text-muted-foreground" />
                  <span className="uppercase">
                    {i18n.language === 'id' ? 'Bahasa Indonesia (ID)' : 'English (EN)'}
                  </span>
                </button>
              </nav>

              {!auth.user && (
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
    </header>
  );
}
