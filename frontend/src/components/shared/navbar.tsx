import { Link, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/context';
import { useState } from 'react';
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Shield,
  Store,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { Button } from '../ui/button';
import { NavbarMobile } from './navbar-mobile';

export function Navbar() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await auth.logout();
    setMobileMenuOpen(false);
    setDesktopDropdownOpen(false);
    navigate({ to: '/' });
  };

  const handleSelectRole = async (role: 'admin' | 'seller' | 'buyer' | 'driver') => {
    try {
      await auth.selectRole(role);
      setDesktopDropdownOpen(false);
      setMobileMenuOpen(false);
      navigate({ to: `/dashboard/${role}` });
    } catch {
      // ignore
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'seller':
        return <Store className="h-4 w-4" />;
      case 'buyer':
        return <ShoppingBag className="h-4 w-4" />;
      case 'driver':
        return <Truck className="h-4 w-4" />;
      default:
        return <LayoutDashboard className="h-4 w-4" />;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight text-primary transition-colors hover:text-primary/95 flex items-center gap-2"
          >
            <span>Seapedia</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link to="/" className="transition-colors hover:text-foreground/80 text-foreground">
              Home
            </Link>
            {auth.user && (
              <Link
                to="/profile"
                className="transition-colors hover:text-foreground/80 text-foreground"
              >
                Profile
              </Link>
            )}
          </nav>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {auth.isLoading ? (
            <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>
          ) : auth.user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                Logged in as <strong className="text-foreground">{auth.user.username}</strong>
              </span>

              {auth.activeRole && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">
                  {getRoleIcon(auth.activeRole)}
                  {auth.activeRole}
                </span>
              )}

              {auth.roles.length > 1 && (
                <Link
                  to="/select-role"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Switch Role
                </Link>
              )}

              {auth.activeRole && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDesktopDropdownOpen(!desktopDropdownOpen)}
                    className="h-8 gap-1 text-xs cursor-pointer"
                  >
                    <span>Dashboard</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>

                  {desktopDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card border border-border py-1 z-50">
                      {auth.roles.map((role) => (
                        <button
                          key={role}
                          onClick={() =>
                            handleSelectRole(role as 'admin' | 'seller' | 'buyer' | 'driver')
                          }
                          className={`w-full text-left px-4 py-2 text-xs hover:bg-accent/50 capitalize flex items-center gap-2 cursor-pointer bg-transparent border-none ${
                            auth.activeRole === role ? 'font-bold text-primary' : 'text-foreground'
                          }`}
                        >
                          {getRoleIcon(role)}
                          <span>{role} Dashboard</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="h-8 text-xs cursor-pointer"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-xs cursor-pointer">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="text-xs cursor-pointer">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {auth.isLoading ? (
            <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>
          ) : (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-foreground hover:bg-accent rounded-md cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      <NavbarMobile
        auth={auth}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        handleLogout={handleLogout}
        handleSelectRole={handleSelectRole}
        getRoleIcon={getRoleIcon}
      />
    </header>
  );
}
