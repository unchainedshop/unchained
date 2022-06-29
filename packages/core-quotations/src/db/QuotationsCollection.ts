import { Db } from '@unchainedshop/types/common';
import { buildDbIndexes } from '@unchainedshop/utils';
import { Quotation } from '@unchainedshop/types/quotations';

export const QuotationsCollection = async (db: Db) => {
  const Quotations = db.collection<Quotation>('quotations');

  // Quotation Indexes
  await buildDbIndexes<Quotation>(Quotations, [
    { index: { userId: 1 } },
    { index: { productId: 1 } },
    { index: { status: 1 } },
    {
      index: {
        _id: 'text',
        userId: 'text',
        quotationNumber: 'text',
        status: 'text',
        'contact.telNumber': 'text',
        'contact.emailAddress': 'text',
      },
      options: {
        weights: {
          _id: 8,
          userId: 3,
          quotationNumber: 6,
          'contact.telNumber': 5,
          'contact.emailAddress': 4,
          status: 1,
        },
        name: 'quotation_fulltext_search',
      },
    },
  ]);

  return Quotations;
};