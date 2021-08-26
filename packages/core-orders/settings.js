import { generateRandomHash } from 'meteor/unchained:utils';

const settings = {
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

export default settings;
