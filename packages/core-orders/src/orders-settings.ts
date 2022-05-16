import { generateRandomHash } from 'meteor/unchained:utils';

export const defaultValidateOrderPosition = ({ product }, { modules }) => {
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
  } = {}) {
    this.ensureUserHasCart = ensureUserHasCart;
    this.orderNumberHashFn = orderNumberHashFn;
    this.validateOrderPosition = validateOrderPosition;
  },
};
