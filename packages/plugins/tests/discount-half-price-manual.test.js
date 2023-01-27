import { HalfPriceManual } from '../src/pricing/discount-half-price-manual';

describe('HalfPriceManual', () => {
  it('isManualAdditionAllowed', async () => {
    expect(await HalfPriceManual.isManualAdditionAllowed()).toBeTruthy();
  });
  
  it('isManualRemovalAllowed', async () => {
    expect(await HalfPriceManual.isManualRemovalAllowed()).toBeTruthy();
  });
  
  it('isValidForSystemTriggering', async () => {
    const context = {};
    const actions = await HalfPriceManual.actions({ context });
    expect(await actions.isValidForSystemTriggering()).toBeFalsy();
  });
  
  it('isValidForCodeTriggering', async () => {
    const context = {};
    const actions = await HalfPriceManual.actions({ context });
    expect(await actions.isValidForCodeTriggering({ code: 'HALFPRICE' })).toBeTruthy();
    expect(await actions.isValidForCodeTriggering({ code: 'othercode' })).toBeFalsy();
  });
  
  it('discountForPricingAdapterKey', async () => {
    const context = {};
    const actions = await HalfPriceManual.actions({ context });
    expect(
      actions.discountForPricingAdapterKey({ pricingAdapterKey: 'shop.unchained.pricing.product-discount' })
    ).toEqual({ rate: 0.5 });
    expect(actions.discountForPricingAdapterKey({ pricingAdapterKey: 'shop.unchained.pricing.other-discount' })).toBeNull();
  });

  it('Actions', async () => {
    const context = {};
    const actions = await HalfPriceManual.actions({ context });
    expect(typeof actions.isValidForSystemTriggering).toBe('function');
    expect(typeof actions.isValidForCodeTriggering).toBe('function');
    expect(typeof actions.discountForPricingAdapterKey).toBe('function');
  });
});