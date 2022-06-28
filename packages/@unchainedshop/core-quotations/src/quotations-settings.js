import { generateRandomHash } from '@unchainedshop/utils';

export const quotationsSettings = {
  quotationNumberHashFn: null,

  configureSettings({ quotationNumberHashFn = generateRandomHash } = {}) {
    this.quotationNumberHashFn = quotationNumberHashFn;
  },
};
