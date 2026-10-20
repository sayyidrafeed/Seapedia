import { createServiceApp, serviceSpec } from '@seapedia/platform/service';
import { adminRouter } from '@/modules/admin/admin.index';
import { buyersRouter } from '@/modules/buyers/buyers.index';
import { discountsBuyerRouter } from '@/modules/discounts/discounts.index';
import { driverRouter } from '@/modules/driver/driver.index';
import { sellerInventoryRouter } from '@/modules/inventory/inventory.index';
import { locationsRouter } from '@/modules/locations/locations.index';
import { ordersRouter, sellerOrdersRouter } from '@/modules/orders/orders.index';
import { runtime } from '@/runtime';

export const app = createServiceApp({
  name: 'commerce',
  verifier: runtime.verifier,
  denylist: runtime.denylist,
});

// Public API (reached through Kong). commerce exposes no service-to-service routes: other services
// learn about orders and stock from its events.
app.route('/api/buyers', buyersRouter);
app.route('/api/orders', ordersRouter);
app.route('/api/seller/orders', sellerOrdersRouter);
app.route('/api/seller/inventory', sellerInventoryRouter);
app.route('/api/discounts', discountsBuyerRouter);
app.route('/api/driver', driverRouter);
app.route('/api/admin', adminRouter);
app.route('/api/locations', locationsRouter);

app.get('/openapi.json', async (c) => c.json(await serviceSpec(app, 'Seapedia Commerce')()));
