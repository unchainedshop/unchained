import type { TimestampFields } from '@unchainedshop/mongodb';

export type Currency = {
  _id?: string;
  isoCode: string;
  isActive: boolean;
  contractAddress?: string;
  decimals?: number;
} & TimestampFields;

export type CurrencyQuery = {
  includeInactive?: boolean;
  contractAddress?: string;
  queryString?: string;
};
