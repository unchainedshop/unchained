import { Db } from '@unchainedshop/types/common';
import { buildDbIndexes } from 'meteor/unchained:utils';
import { Quotation } from '@unchainedshop/types/quotations';

export const QuotationsCollection = async (db: Db) => {
  const Quotations = db.collection<Quotation>('quotations');

  // Quotation Indexes
  await buildDbIndexes<Quotation>(Quotations, [
    { index: { userId: 1 } },
    { index: { productId: 1 } },
    { index: { status: 1 } },
  ]);

  return Quotations;
};
