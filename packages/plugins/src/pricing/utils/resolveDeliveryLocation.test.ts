import { describe, it } from 'node:test';
import assert from 'node:assert';
import resolveDeliveryLocation from './resolveDeliveryLocation.ts';

describe('resolveDeliveryLocation', () => {
  it('prefers the delivery address country over billing and order country', () => {
    const location = resolveDeliveryLocation({
      orderDelivery: { context: { address: { countryCode: 'de', regionCode: 'by' } } } as any,
      order: { countryCode: 'CH', billingAddress: { countryCode: 'FR' } } as any,
    });
    assert.deepStrictEqual(location, { countryCode: 'DE', regionCode: 'BY' });
  });

  it('falls back to the billing address, then the order country', () => {
    assert.deepStrictEqual(
      resolveDeliveryLocation({
        order: { countryCode: 'CH', billingAddress: { countryCode: 'AT' } } as any,
      }),
      { countryCode: 'AT', regionCode: null },
    );
    assert.deepStrictEqual(resolveDeliveryLocation({ order: { countryCode: 'CH' } as any }), {
      countryCode: 'CH',
      regionCode: null,
    });
  });

  it('lets an explicit countryCode win unless an address overrides it', () => {
    assert.strictEqual(
      resolveDeliveryLocation({ countryCode: ' us ', order: null }).countryCode,
      'US',
    );
    assert.strictEqual(
      resolveDeliveryLocation({
        countryCode: 'US',
        order: { billingAddress: { countryCode: 'CA' } } as any,
      }).countryCode,
      'CA',
    );
  });

  it('normalizes case and whitespace and returns nulls when unknown', () => {
    assert.deepStrictEqual(
      resolveDeliveryLocation({
        order: { billingAddress: { countryCode: ' us ', regionCode: ' ca ' } } as any,
      }),
      { countryCode: 'US', regionCode: 'CA' },
    );
    assert.deepStrictEqual(resolveDeliveryLocation({}), { countryCode: null, regionCode: null });
  });
});
