import { generateRandomHash } from 'meteor/unchained:utils';

export const quotationsSettings = {
  quotationNumberHashFn: null,
  load({ quotationNumberHashFn = generateRandomHash } = {}) {
    this.quotationNumberHashFn = quotationNumberHashFn;
  },
};
