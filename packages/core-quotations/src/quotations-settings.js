import { generateRandomHash } from 'meteor/unchained:utils';

export const quotationsSettings = {
  quotationNumberHashFn: null,
  
  configureSettings({ quotationNumberHashFn = generateRandomHash } = {}) {
    this.quotationNumberHashFn = quotationNumberHashFn;
  },
};
