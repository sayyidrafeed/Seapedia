import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/context';
import {
  LogOut,
  ChevronDown,
  User,
  Shield,
  Store,
  ShoppingBag,
  Truck,
  LayoutDashboard,
  Languages,
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';

export function UserMenu() {
  const { t, i18n } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!auth.user) return null;

  const closeMenu = () => {
    setIsOpen(false);
    setDrawerOpen(false);
  };

  const handleLogout = async () => {
    await auth.logout();
    closeMenu();
    navigate({ to: '/' });
  };

  const handleSelectRole = async (role: 'admin' | 'seller' | 'buyer' | 'driver') => {
    try {
      await auth.selectRole(role);
      closeMenu();
      navigate({
        to: `/dashboard/${role}` as
          | '/dashboard/admin'
          | '/dashboard/seller'
          | '/dashboard/driver'
          | '/dashboard/buyer',
      });
    } catch {}
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, React.ReactNode> = {
      admin: <Shield className="h-4 w-4" />,
      seller: <Store className="h-4 w-4" />,
      buyer: <ShoppingBag className="h-4 w-4" />,
      driver: <Truck className="h-4 w-4" />,
    };
    return icons[role] || <LayoutDashboard className="h-4 w-4" />;
  };

  const renderMenuContent = () => {
    if (!auth.user) return null;
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
            {auth.user.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{auth.user.username}</p>
            <p className="text-xs text-muted-foreground truncate">{auth.user.email || ''}</p>
          </div>
        </div>
        {auth.activeRole && (
          <div className="px-4 py-2 border-b border-border bg-muted/30">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary capitalize">
              {getRoleIcon(auth.activeRole)}
              {t('navbar.activeRoleLabel', { role: t(`role.${auth.activeRole}`) })}
            </span>
          </div>
        )}
        {auth.roles.length > 1 && (
          <div className="px-2 py-2 border-b border-border">
            <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {t('navbar.switchRole')}
            </p>
            <div className="space-y-0.5">
              {auth.roles
                .filter((r) => r !== auth.activeRole)
                .map((role) => (
                  <button
                    key={role}
                    onClick={() =>
                      handleSelectRole(role as 'admin' | 'seller' | 'buyer' | 'driver')
                    }
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted rounded-md capitalize flex items-center gap-2 cursor-pointer bg-transparent border-none text-foreground"
                  >
                    {getRoleIcon(role)}
                    <span>{t('navbar.dashboardWithRole', { context: role })}</span>
                  </button>
                ))}
            </div>
          </div>
        )}
        <div className="px-2 py-1.5 border-b border-border">
          <Link
            to="/profile"
            onClick={closeMenu}
            className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted rounded-md flex items-center gap-2 text-foreground"
          >
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{t('navbar.profile')}</span>
          </Link>
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'id' ? 'en' : 'id')}
            className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted rounded-md flex items-center gap-2 cursor-pointer bg-transparent border-none text-foreground"
          >
            <Languages className="h-4 w-4 text-muted-foreground" />
            <span className="uppercase">
              {i18n.language === 'id' ? 'Bahasa Indonesia (ID)' : 'English (EN)'}
            </span>
          </button>
        </div>
        <div className="px-2 pt-1.5 pb-2">
          <button
            onClick={handleLogout}
            className="w-full text-left px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-md flex items-center gap-2 cursor-pointer bg-transparent border-none"
          >
            <LogOut className="h-4 w-4" />
            <span>{t('navbar.logout')}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => (isMobile ? setDrawerOpen(true) : setIsOpen(!isOpen))}
        className="flex items-center gap-2 p-1.5 rounded-full hover:bg-muted transition-colors cursor-pointer text-left focus:outline-none"
        aria-haspopup="true"
        aria-expanded={isOpen || drawerOpen}
      >
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
          {auth.user.username.charAt(0).toUpperCase()}
        </div>
        <div className="hidden sm:block text-xs font-semibold pr-1">
          <p className="text-foreground leading-none">{auth.user.username}</p>
          {auth.activeRole && (
            <p className="text-muted-foreground text-[10px] mt-0.5 capitalize">
              {t(`role.${auth.activeRole}`)}
            </p>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen || drawerOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && !isMobile && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg bg-card border border-border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {renderMenuContent()}
        </div>
      )}

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="p-4 pb-6">
          <div className="max-w-md mx-auto w-full">
            <DrawerHeader className="px-0 pt-0 text-left sr-only">
              <DrawerTitle>{t('navbar.profile')}</DrawerTitle>
              <DrawerDescription>Account settings and options</DrawerDescription>
            </DrawerHeader>
            <div className="mt-2">{renderMenuContent()}</div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
