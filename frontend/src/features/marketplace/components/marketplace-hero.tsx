import { Input } from '@/components/ui/input';

interface MarketplaceHeroProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function MarketplaceHero({ search, onSearchChange }: MarketplaceHeroProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Welcome to <span className="text-primary">Seapedia</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Browse all available products from our verified stores.
        </p>
      </div>

      <div className="w-full sm:max-w-xs">
        <Input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
