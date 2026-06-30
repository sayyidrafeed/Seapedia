import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

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

      <div className="w-full sm:max-w-xs relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
