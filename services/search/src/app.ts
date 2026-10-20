import { createServiceApp } from '@seapedia/platform/service';
import { searchRouter } from '@/modules/search/search.index';
import { runtime } from '@/runtime';

export const app = createServiceApp({
  name: 'search',
  verifier: runtime.verifier,
  denylist: runtime.denylist,
});

app.route('/search', searchRouter);
