export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-6 mt-auto">
      <div className="container mx-auto px-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Seapedia Marketplace. Evolved from edge-native to
        self-hosted Monorepo.
      </div>
    </footer>
  );
}
