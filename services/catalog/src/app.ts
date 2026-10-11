import { createServiceApp, serviceSpec } from '@seapedia/platform/service';
import { env } from '@/env';
import { catalogOutbox } from '@/modules/events/events.index';
import { productReviewsRouter } from '@/modules/product-reviews/product-reviews.index';
import {
  productsInternalRouter,
  productsRouter,
  sellerProductsRouter,
} from '@/modules/products/products.index';
import { reviewsRouter } from '@/modules/reviews/reviews.index';
import { searchInternalRouter } from '@/modules/search/search.index';
import { storesInternalRouter, storesRouter } from '@/modules/stores/stores.index';

export const app = createServiceApp({ name: 'catalog', internalToken: env.INTERNAL_API_TOKEN });

// Public API (reached through the gateway)
app.route('/api/products', productsRouter);
app.route('/api/products', productReviewsRouter);
app.route('/api/seller/products', sellerProductsRouter);
app.route('/api/stores', storesRouter);
app.route('/api/reviews', reviewsRouter);

// Internal API (service-to-service)
app.route('/internal', productsInternalRouter);
app.route('/internal/stores', storesInternalRouter);
app.route('/internal/search', searchInternalRouter);
app.route('/internal/outbox', catalogOutbox.router);

app.get('/openapi.json', async (c) => c.json(await serviceSpec(app, 'Seapedia Catalog')()));
