import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { Quotation } from '@unchainedshop/types/quotations.js';

export const QuotationsCollection = async (db: mongodb.Db) => {
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
      } as any,
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
