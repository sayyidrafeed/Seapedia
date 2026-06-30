import { factory } from '@/lib/factory';
import { discountsAdminRouter } from '@/modules/discounts/discounts-routes';
import { dashboardRouter } from './admin.routes';

export const adminRouter = factory.createApp();

// Mount discounts admin routes (like /vouchers, /promos) and the dashboard routes.
// In app.ts, adminRouter is mounted at /api/admin.
// Hence, /vouchers becomes /api/admin/vouchers and /dashboard becomes /api/admin/dashboard.
adminRouter.route('/', discountsAdminRouter);
adminRouter.route('/', dashboardRouter);

export * from './admin.routes';
export * from './admin.schemas';
export * from './admin.service';
export * from './admin.constants';
