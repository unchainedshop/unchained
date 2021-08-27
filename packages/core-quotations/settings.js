import { generateRandomHash } from 'meteor/unchained:utils';

const settings = {
  quotationNumberHashFn: null,
  load({ quotationNumberHashFn = generateRandomHash } = {}) {
    this.quotationNumberHashFn = quotationNumberHashFn;
  },
};

export default settings;
