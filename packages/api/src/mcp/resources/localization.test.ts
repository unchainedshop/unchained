import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildChatResourceContext } from './localization.ts';
import type { Context } from '../../context.ts';

const adminContext = (overrides: Record<string, any> = {}) =>
  ({
    user: { _id: 'admin', roles: ['admin'] },
    modules: {
      languages: {
        findLanguages: async () => [{ isoCode: 'de', isActive: true }],
      },
      countries: {
        findCountries: async () => [{ isoCode: 'CH', isActive: true }],
      },
      currencies: {
        findCurrencies: async () => [{ isoCode: 'CHF', isActive: true, decimals: 2 }],
      },
      ...overrides,
    },
  }) as unknown as Context;

describe('buildChatResourceContext', () => {
  it('renders all three resource sections for admins', async () => {
    const context = await buildChatResourceContext(adminContext());
    assert.match(context, /^\n\nAVAILABLE SHOP CONFIGURATION:\n/);
    assert.match(context, /shop-languages:\n/);
    assert.match(context, /shop-currencies:\n/);
    assert.match(context, /shop-countries:\n/);
    assert.match(context, /"CHF"/);
  });

  it('returns an empty string without a context', async () => {
    assert.strictEqual(await buildChatResourceContext(undefined), '');
  });

  it('returns an empty string for non-admin users', async () => {
    // Mirrors the /mcp auth wall the loopback client used to pass through.
    const context = adminContext();
    (context as any).user = { _id: 'user', roles: [] };
    assert.strictEqual(await buildChatResourceContext(context), '');
  });

  it('skips a failing section instead of failing the whole block', async () => {
    const context = adminContext({
      currencies: {
        findCurrencies: async () => {
          throw new Error('db down');
        },
      },
    });
    const result = await buildChatResourceContext(context);
    assert.match(result, /shop-languages:\n/);
    assert.doesNotMatch(result, /shop-currencies:/);
  });
});
