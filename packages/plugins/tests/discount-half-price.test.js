import { HalfPrice  } from '../src/pricing/discount-half-price';
import {jest} from '@jest/globals'
describe('HalfPrice', () => {
  it('isManualAdditionAllowed', async () => {
    expect(await HalfPrice.isManualAdditionAllowed()).toBeFalsy();
  });

  it('isManualRemovalAllowed', async () => {
    expect(await HalfPrice.isManualRemovalAllowed()).toBeFalsy();
  });

  it('isValidForSystemTriggering', async () => {
    const context = {
      modules: {
        users: {
          findUserById: jest.fn(() => Promise.resolve({ tags: ['half-price'] }))
        }
      },
      order: { userId: 'user-id' }
    };
    const actions = await HalfPrice.actions({ context });
    expect(await actions.isValidForSystemTriggering()).toBeTruthy();

    context.modules.users.findUserById.mockImplementationOnce(() => Promise.resolve({ tags: [] }));
    expect(await actions.isValidForSystemTriggering()).toBeFalsy();
  });
  it('discountForPricingAdapterKey', async () => {
    const context = {};
    const actions = await HalfPrice.actions({ context });
    expect(actions.discountForPricingAdapterKey({ pricingAdapterKey: 'shop.unchained.pricing.product-discount' })).toEqual({ rate: 0.5 });
    expect(actions.discountForPricingAdapterKey({ pricingAdapterKey: 'shop.unchained.pricing.other-discount' })).toBeNull();
  });

  it('isValidForCodeTriggering', async () => {
    const context = {};
    const actions = await HalfPrice.actions({ context });
    expect(await actions.isValidForCodeTriggering()).toBeFalsy();
  });
});
