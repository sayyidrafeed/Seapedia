import { afterEach, describe, expect, test } from 'bun:test';
import { createResolver } from './discovery';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function consulReturns(instances: { address: string; port: number }[]) {
  globalThis.fetch = (async () =>
    Response.json(
      instances.map((i) => ({
        Service: { Address: i.address, Port: i.port, ID: i.address },
        Node: { Address: '' },
      })),
    )) as unknown as typeof fetch;
}

describe('client-side discovery', () => {
  test('round-robins across healthy instances', async () => {
    consulReturns([
      { address: '10.0.0.1', port: 4004 },
      { address: '10.0.0.2', port: 4004 },
    ]);
    const resolver = createResolver('http://consul.test');
    const picked = [
      await resolver.resolve('search'),
      await resolver.resolve('search'),
      await resolver.resolve('search'),
    ];
    expect(picked).toEqual([
      'http://10.0.0.1:4004',
      'http://10.0.0.2:4004',
      'http://10.0.0.1:4004',
    ]);
  });

  test('fails clearly when no instance is healthy', async () => {
    consulReturns([]);
    await expect(createResolver('http://consul.test').resolve('search')).rejects.toThrow(
      'no healthy instance of search',
    );
  });
});
