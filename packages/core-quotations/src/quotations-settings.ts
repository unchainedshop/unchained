import { generateRandomHash } from '@unchainedshop/utils';
import type { Quotation } from './db/QuotationsCollection.ts';

export interface QuotationsSettings {
  quotationNumberHashFn: (quotation: Quotation, index: number) => string;
  configureSettings: (options: QuotationsSettingsOptions) => void;
}

export type QuotationsSettingsOptions = Omit<Partial<QuotationsSettings>, 'configureSettings'>;

export const quotationsSettings: QuotationsSettings = {
  quotationNumberHashFn: generateRandomHash,
  configureSettings({ quotationNumberHashFn } = {}) {
    this.quotationNumberHashFn = quotationNumberHashFn || generateRandomHash;
  },
};
