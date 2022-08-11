import { QuotationsSettingsOptions } from '@unchainedshop/types/quotations';
import { generateRandomHash } from '@unchainedshop/utils';

export const quotationsSettings = {
  quotationNumberHashFn: null,

  configureSettings({ quotationNumberHashFn = generateRandomHash }: QuotationsSettingsOptions = {}) {
    this.quotationNumberHashFn = quotationNumberHashFn;
  },
};
