import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { ordersSettings } from './orders-settings.ts';

describe('ordersSettings.configureSettings', () => {
  // ordersSettings is shared with a platform running in the same process (npm test)
  let configured: Partial<typeof ordersSettings>;
  beforeEach(() => {
    configured = { ...ordersSettings };
  });
  afterEach(() => {
    Object.assign(ordersSettings, configured);
  });

  it('stores reserveForCheckout from the orders options', () => {
    const reserveForCheckout = async () => ({ release: async () => undefined });

    ordersSettings.configureSettings({ reserveForCheckout });

    assert.equal(ordersSettings.reserveForCheckout, reserveForCheckout);
  });

  it('has no reserveForCheckout without the option, also after it was configured', () => {
    ordersSettings.configureSettings({ reserveForCheckout: async () => undefined });

    ordersSettings.configureSettings();
    assert.equal(ordersSettings.reserveForCheckout, undefined);

    ordersSettings.configureSettings({ ensureUserHasCart: true });
    assert.equal(ordersSettings.reserveForCheckout, undefined);
  });
});
