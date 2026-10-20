import { createServiceApp, serviceSpec } from '@seapedia/platform/service';
import { productReviewsRouter } from '@/modules/product-reviews/product-reviews.index';
import { productsRouter, sellerProductsRouter } from '@/modules/products/products.index';
import { reviewsRouter } from '@/modules/reviews/reviews.index';
import { searchExportRouter } from '@/modules/search/search.index';
import { storesRouter } from '@/modules/stores/stores.index';
import { runtime } from '@/runtime';

export const app = createServiceApp({
  name: 'catalog',
  verifier: runtime.verifier,
  denylist: runtime.denylist,
});

// Public API (reached through Kong)
app.route('/api/products', productsRouter);
app.route('/api/products', productReviewsRouter);
app.route('/api/seller/products', sellerProductsRouter);
app.route('/api/stores', storesRouter);
app.route('/api/reviews', reviewsRouter);

// Service-to-service, scoped: never routed by Kong
app.route('/internal/search', searchExportRouter);

app.get('/openapi.json', async (c) => c.json(await serviceSpec(app, 'Seapedia Catalog')()));
