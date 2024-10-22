import { HundredOff } from './discount-100-off.js';

describe('HundredOff', () => {
  it('isManualAdditionAllowed', async () => {
    let x;
    expect(await HundredOff.isManualAdditionAllowed(x)).toBeTruthy();
  });
  it('isManualRemovalAllowed', async () => {
    expect(await HundredOff.isManualRemovalAllowed()).toBeTruthy();
  });
  it('isValidForSystemTriggering', async () => {
    const context = {};
    const actions = await HundredOff.actions({ context } as any);
    expect(await actions.isValidForSystemTriggering()).toBeFalsy();
  });
  it('isValidForCodeTriggering', async () => {
    const context = {};
    const actions = await HundredOff.actions({ context } as any);
    expect(await actions.isValidForCodeTriggering({ code: '100OFF' })).toBeTruthy();
    expect(await actions.isValidForCodeTriggering({ code: 'wrongcode' })).toBeFalsy();
  });

  it('discountForPricingAdapterKey', async () => {
    const context = {};
    const actions = await HundredOff.actions({ context } as any);
    expect(
      actions.discountForPricingAdapterKey({
        pricingAdapterKey: 'shop.unchained.pricing.order-discount',
      } as any),
    ).toEqual({ fixedRate: 10000 });
    expect(
      actions.discountForPricingAdapterKey({
        pricingAdapterKey: 'shop.unchained.pricing.other-discount',
      } as any),
    ).toBeNull();
  });
});
