import * as React from 'react';
import { Link } from '@tanstack/react-router';

interface NavItem {
  label: string;
  to: string;
  icon?: React.ReactNode;
  exact?: boolean;
}

interface DashboardLayoutProps {
  title: string;
  description: string;
  navItems: NavItem[];
  children: React.ReactNode;
  extraHeaderContent?: React.ReactNode;
}

export function DashboardLayout({
  title,
  description,
  navItems,
  children,
  extraHeaderContent,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] bg-background-subtle">
      {/* Sidebar (Desktop lg+) */}
      <aside className="w-[var(--sidebar-width)] border-r border-border bg-card hidden lg:block shrink-0">
        <div className="sticky top-[var(--header-height)] h-[calc(100vh-var(--header-height))] p-4 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
                Navigation
              </h2>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: item.exact }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all hover:bg-muted duration-normal"
                    activeProps={{ className: 'bg-primary-subtle text-primary font-semibold' }}
                    inactiveProps={{ className: 'text-foreground-secondary hover:text-foreground' }}
                  >
                    {item.icon && <span className="shrink-0">{item.icon}</span>}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area - Declared as container context for child components */}
      <div className="flex-1 min-w-0 flex flex-col @container">
        {/* Header */}
        <header className="border-b border-border bg-card px-8 py-6 shrink-0">
          <div className="max-w-[var(--content-max-width)] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-0.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground capitalize">
                {title}
              </h1>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            {extraHeaderContent && <div className="shrink-0">{extraHeaderContent}</div>}
          </div>
        </header>

        {/* Tablet Horizontal Navigation (md to lg) */}
        {navItems.length > 0 && (
          <div className="hidden md:flex lg:hidden border-b border-border bg-card px-8 py-2 overflow-x-auto scrollbar-none flex gap-4 whitespace-nowrap shrink-0">
            <nav className="flex gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.exact }}
                  className="text-xs font-semibold py-1.5 border-b-2 border-transparent transition-all flex items-center gap-1.5"
                  activeProps={{ className: 'border-primary text-primary font-bold' }}
                  inactiveProps={{ className: 'text-muted-foreground hover:text-foreground' }}
                >
                  {item.icon && <span className="scale-90">{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Mobile Horizontal Navigation Tabs (< md) */}
        {navItems.length > 0 && (
          <div className="md:hidden border-b border-border bg-card px-8 py-2 overflow-x-auto scrollbar-none flex gap-4 whitespace-nowrap shrink-0">
            <nav className="flex gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.exact }}
                  className="text-xs font-semibold py-1 border-b-2 border-transparent transition-all"
                  activeProps={{ className: 'border-primary text-primary font-bold' }}
                  inactiveProps={{ className: 'text-muted-foreground' }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Inner Content Grid */}
        <main className="px-8 py-8 max-w-[var(--content-max-width)] mx-auto w-full flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
