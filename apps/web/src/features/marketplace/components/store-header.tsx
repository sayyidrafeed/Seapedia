interface Store {
  name: string;
  description: unknown;
  createdAt: string;
  logoUrl?: unknown;
}

interface StoreHeaderProps {
  store: Store;
}

export function StoreHeader({ store }: StoreHeaderProps) {
  return (
    <div className="bg-card border border-border p-8 rounded-xl shadow-sm text-center md:text-left md:flex items-center gap-6">
      {store.logoUrl ? (
        <img
          src={store.logoUrl as string}
          alt={store.name}
          className="w-24 h-24 rounded-full object-cover mx-auto md:mx-0 border border-border"
        />
      ) : (
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto md:mx-0 text-3xl font-bold text-primary">
          {store.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{store.name}</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          {(store.description as string) || 'Welcome to our store on Seapedia!'}
        </p>
        <div className="mt-4 text-sm text-muted-foreground">
          Joined on {new Date(store.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
