import { HalfPriceManual } from './discount-half-price-manual.js';

describe('HalfPriceManual', () => {
  it('isManualAdditionAllowed', async () => {
    let x;
    expect(await HalfPriceManual.isManualAdditionAllowed(x)).toBeTruthy();
  });

  it('isManualRemovalAllowed', async () => {
    expect(await HalfPriceManual.isManualRemovalAllowed()).toBeTruthy();
  });

  it('isValidForSystemTriggering', async () => {
    const context = {};
    const actions = await HalfPriceManual.actions({ context } as any);
    expect(await actions.isValidForSystemTriggering()).toBeFalsy();
  });

  it('isValidForCodeTriggering', async () => {
    const context = {};
    const actions = await HalfPriceManual.actions({ context } as any);
    expect(await actions.isValidForCodeTriggering({ code: 'HALFPRICE' })).toBeTruthy();
    expect(await actions.isValidForCodeTriggering({ code: 'othercode' })).toBeFalsy();
  });

  it('discountForPricingAdapterKey', async () => {
    const context = {};
    const actions = await HalfPriceManual.actions({ context } as any);
    expect(
      actions.discountForPricingAdapterKey({
        pricingAdapterKey: 'shop.unchained.pricing.product-discount',
      } as any),
    ).toEqual({ rate: 0.5 });
    expect(
      actions.discountForPricingAdapterKey({
        pricingAdapterKey: 'shop.unchained.pricing.other-discount',
      } as any),
    ).toBeNull();
  });

  it('Actions', async () => {
    const context = {};
    const actions = await HalfPriceManual.actions({ context } as any);
    expect(typeof actions.isValidForSystemTriggering).toBe('function');
    expect(typeof actions.isValidForCodeTriggering).toBe('function');
    expect(typeof actions.discountForPricingAdapterKey).toBe('function');
  });
});
