import { createServiceApp } from '@seapedia/platform/service';
import { env } from '@/env';
import { searchRouter } from '@/modules/search/search.index';

export const app = createServiceApp({ name: 'search', internalToken: env.INTERNAL_API_TOKEN });

app.route('/search', searchRouter);
