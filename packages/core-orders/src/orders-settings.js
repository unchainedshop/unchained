import { generateRandomHash } from 'meteor/unchained:utils';

export const ordersSettings = {
  ensureUserHasCart: null,
  orderNumberHashFn: null,
  load({
    ensureUserHasCart = false,
    orderNumberHashFn = generateRandomHash,
  } = {}) {
    this.ensureUserHasCart = ensureUserHasCart;
    this.orderNumberHashFn = orderNumberHashFn;
  },
};
