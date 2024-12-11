import { generateRandomHash } from '@unchainedshop/utils';
import { Quotation } from './db/QuotationsCollection.js';

export interface QuotationsSettingsOptions {
  quotationNumberHashFn?: (quotation: Quotation, index: number) => string;
}

export const quotationsSettings = {
  quotationNumberHashFn: null,

  configureSettings({ quotationNumberHashFn = generateRandomHash }: QuotationsSettingsOptions = {}) {
    this.quotationNumberHashFn = quotationNumberHashFn;
  },
};
