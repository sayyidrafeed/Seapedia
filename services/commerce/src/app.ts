import { createServiceApp, serviceSpec } from '@seapedia/platform/service';
import { env } from '@/env';
import { adminRouter } from '@/modules/admin/admin.index';
import { buyersRouter } from '@/modules/buyers/buyers.index';
import { discountsBuyerRouter } from '@/modules/discounts/discounts.index';
import { driverRouter } from '@/modules/driver/driver.index';
import { commerceOutbox } from '@/modules/events/events.index';
import {
  inventoryInternalRouter,
  sellerInventoryRouter,
} from '@/modules/inventory/inventory.index';
import { locationsRouter } from '@/modules/locations/locations.index';
import {
  ordersInternalRouter,
  ordersRouter,
  sellerOrdersRouter,
} from '@/modules/orders/orders.index';

export const app = createServiceApp({ name: 'commerce', internalToken: env.INTERNAL_API_TOKEN });

// Public API (reached through the gateway)
app.route('/api/buyers', buyersRouter);
app.route('/api/orders', ordersRouter);
app.route('/api/seller/orders', sellerOrdersRouter);
app.route('/api/seller/inventory', sellerInventoryRouter);
app.route('/api/discounts', discountsBuyerRouter);
app.route('/api/driver', driverRouter);
app.route('/api/admin', adminRouter);
app.route('/api/locations', locationsRouter);

// Internal API (service-to-service)
app.route('/internal', ordersInternalRouter);
app.route('/internal/inventory', inventoryInternalRouter);
app.route('/internal/outbox', commerceOutbox.router);

app.get('/openapi.json', async (c) => c.json(await serviceSpec(app, 'Seapedia Commerce')()));
