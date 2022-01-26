import { generateRandomHash } from 'meteor/unchained:utils';

export const ordersSettings = {
  ensureUserHasCart: null,
  orderNumberHashFn: null,

  configureSettings({ ensureUserHasCart = false, orderNumberHashFn = generateRandomHash } = {}) {
    this.ensureUserHasCart = ensureUserHasCart;
    this.orderNumberHashFn = orderNumberHashFn;
  },
};
