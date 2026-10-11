export type ServiceName = 'identity' | 'catalog' | 'commerce';

/**
 * Public route table: which service owns each `/api` prefix. Longest prefix wins, so
 * `/api/seller/orders` reaches commerce while `/api/seller/products` reaches catalog.
 * Search is deliberately absent: only catalog talks to it.
 */
const ROUTES: [prefix: string, service: ServiceName][] = [
  ['/api/auth', 'identity'],
  ['/api/users', 'identity'],
  ['/api/private', 'identity'],
  ['/api/products', 'catalog'],
  ['/api/seller/products', 'catalog'],
  ['/api/stores', 'catalog'],
  ['/api/reviews', 'catalog'],
  ['/api/buyers', 'commerce'],
  ['/api/orders', 'commerce'],
  ['/api/seller/orders', 'commerce'],
  ['/api/seller/inventory', 'commerce'],
  ['/api/discounts', 'commerce'],
  ['/api/driver', 'commerce'],
  ['/api/admin', 'commerce'],
  ['/api/locations', 'commerce'],
].sort((a, b) => b[0].length - a[0].length) as [string, ServiceName][];

export function routeFor(path: string): ServiceName | undefined {
  return ROUTES.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))?.[1];
}
