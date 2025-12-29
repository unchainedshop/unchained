import {
  mongodb,
  buildDbIndexes,
  type TimestampFields,
  type LogFields,
  isDocumentDBCompatModeEnabled,
} from '@unchainedshop/mongodb';

// NOTE: Renamed from FULLFILLED to FULFILLED in v5.0.0
// Migration for status: db.quotations.updateMany({ status: 'FULLFILLED' }, { $set: { status: 'FULFILLED' } })
// Migration for field: db.quotations.updateMany({ fullfilled: { $exists: true } }, { $rename: { fullfilled: 'fulfilled' } })
export const QuotationStatus = {
  REQUESTED: 'REQUESTED',
  PROCESSING: 'PROCESSING',
  PROPOSED: 'PROPOSED',
  FULFILLED: 'FULFILLED',
  REJECTED: 'REJECTED',
} as const;

export type QuotationStatus = (typeof QuotationStatus)[keyof typeof QuotationStatus];

export interface QuotationProposal {
  price?: number;
  expires?: Date;
  meta?: any;
}

export interface QuotationItemConfiguration {
  quantity?: number;
  configuration: { key: string; value: string }[];
}

export type Quotation = {
  _id: string;
  configuration?: { key: string; value: string }[];
  context?: any;
  countryCode?: string;
  currencyCode?: string;
  expires?: Date;
  fulfilled?: Date;
  meta?: any;
  price?: number;
  productId: string;
  quotationNumber?: string;
  rejected?: Date;
  status: string | null;
  userId: string;
} & LogFields &
  TimestampFields;

export const QuotationsCollection = async (db: mongodb.Db) => {
  const Quotations = db.collection<Quotation>('quotations');

  if (!isDocumentDBCompatModeEnabled()) {
    await buildDbIndexes<Quotation>(Quotations, [
      {
        index: {
          _id: 'text',
          userId: 'text',
          quotationNumber: 'text',
          status: 'text',
        } as any,
        options: {
          weights: {
            _id: 8,
            userId: 3,
            quotationNumber: 6,
            status: 1,
          },
          name: 'quotation_fulltext_search',
        },
      },
    ]);
  }

  // Quotation Indexes
  await buildDbIndexes<Quotation>(Quotations, [
    { index: { userId: 1 } },
    { index: { productId: 1 } },
    { index: { status: 1 } },
  ]);

  return Quotations;
};
