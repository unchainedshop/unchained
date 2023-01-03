import { OrdersSettingsOptions } from '@unchainedshop/types/orders.js';
import { generateRandomHash } from '@unchainedshop/utils';

export const defaultValidateOrderPosition = async ({ product }, { modules }) => {
  if (!modules.products.isActive(product)) {
    throw new Error('This product is inactive');
  }
};

export const ordersSettings = {
  ensureUserHasCart: null,
  orderNumberHashFn: null,
  validateOrderPosition: null,

  configureSettings({
    ensureUserHasCart = false,
    orderNumberHashFn = generateRandomHash,
    validateOrderPosition = defaultValidateOrderPosition,
  }: OrdersSettingsOptions = {}) {
    this.ensureUserHasCart = ensureUserHasCart;
    this.orderNumberHashFn = orderNumberHashFn;
    this.validateOrderPosition = validateOrderPosition;
  },
};
