import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { LocationsProvider } from './locations.service';

describe('LocationsProvider', () => {
  beforeEach(() => {
    // Clear cache
    (LocationsProvider as unknown as { cache: Map<string, unknown> }).cache.clear();
  });

  test('getProvinces fetches provinces and maps correctly', async () => {
    const mockProvinces = {
      data: [
        { code: '11', name: 'Aceh' },
        { code: '12', name: 'Sumatera Utara' },
      ],
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify(mockProvinces), { status: 200 })),
    ) as unknown as typeof globalThis.fetch;

    try {
      const provinces = await LocationsProvider.getProvinces();
      expect(provinces).toEqual([
        { id: '11', name: 'Aceh' },
        { id: '12', name: 'Sumatera Utara' },
      ]);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      // Call again to verify cache
      const provincesCached = await LocationsProvider.getProvinces();
      expect(provincesCached).toEqual(provinces);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1); // cache hit
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('validateHierarchy verifies valid and invalid path', async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = mock((url: string) => {
      if (url.includes('provinces.json')) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: [{ code: '11', name: 'Aceh' }] }), { status: 200 }),
        );
      }
      if (url.includes('regencies/11.json')) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: [{ code: '1101', name: 'Simeulue' }] }), {
            status: 200,
          }),
        );
      }
      if (url.includes('districts/1101.json')) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: [{ code: '1101010', name: 'Teupah Barat' }] }), {
            status: 200,
          }),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }));
    }) as unknown as typeof globalThis.fetch;

    try {
      const isValid = await LocationsProvider.validateHierarchy('Aceh', 'Simeulue', 'Teupah Barat');
      expect(isValid).toBe(true);

      const isInvalid = await LocationsProvider.validateHierarchy(
        'Aceh',
        'Simeulue',
        'Teupah Timur',
      );
      expect(isInvalid).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
