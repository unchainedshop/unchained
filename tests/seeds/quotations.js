export const ProcessingQuotation = {
  _id: 'processing-quotation',
  created: new Date('2019-10-14T19:02:31.796+0000'),
  status: 'PROCESSING',
  userId: 'user',
  productId: 'simpleproduct',
  configuration: [
    {
      key: 'length',
      value: '5',
    },
    {
      key: 'height',
      value: '10',
    },
  ],
  countryCode: 'CH',
  log: [
    {
      date: new Date('2019-10-14T19:02:36.845+0000'),
      status: 'PROCESSING',
      info: 'verified elligibility manually',
    },
  ],
  quotationNumber: 'K271P03',
  updated: new Date('2019-10-14T19:02:36.845+0000'),
};

export const ProposedQuotation = {
  _id: 'RdRBLi4zKGxskm6pc',
  created: new Date('2019-10-14T19:07:56.833+0000'),
  status: 'PROPOSED',
  userId: 'user',
  productId: 'simpleproduct',
  configuration: [
    {
      key: 'length',
      value: '5',
    },
    {
      key: 'height',
      value: '10',
    },
  ],
  countryCode: 'CH',
  log: [
    {
      date: new Date('2019-10-14T19:08:01.178+0000'),
      status: 'PROCESSING',
      info: 'verified elligibility manually',
    },
    {
      date: new Date('2019-10-14T19:08:05.366+0000'),
      status: 'PROPOSED',
      info: 'proposed manually',
    },
  ],
  quotationNumber: 'WGE9DLE7',
  updated: new Date('2019-10-14T19:08:05.381+0000'),
  expires: new Date('2019-10-14T19:08:05.000+0000'),
};

// All quotations for seeding
const allQuotations = [ProcessingQuotation, ProposedQuotation];

export default async function seedQuotations(db) {
  await db.collection('quotations').findOrInsertOne(ProcessingQuotation);
  await db.collection('quotations').findOrInsertOne(ProposedQuotation);
}

/**
 * Seed quotations into the Drizzle database.
 * This directly inserts into the database WITHOUT using the module to avoid emitting events.
 * FTS index is automatically populated by SQLite triggers.
 */
export async function seedQuotationsToDrizzle(db) {
  const { quotations } = await import('@unchainedshop/core-quotations');

  // Delete all existing quotations (FTS is cleaned by trigger)
  await db.delete(quotations);

  // Insert all quotations directly (FTS is populated by trigger)
  for (const quotation of allQuotations) {
    await db.insert(quotations).values({
      _id: quotation._id,
      userId: quotation.userId,
      productId: quotation.productId,
      countryCode: quotation.countryCode,
      currencyCode: quotation.currencyCode || null,
      quotationNumber: quotation.quotationNumber,
      status: quotation.status,
      price: quotation.price || null,
      expires: quotation.expires,
      fulfilled: quotation.fulfilled || null,
      rejected: quotation.rejected || null,
      configuration: quotation.configuration ? JSON.stringify(quotation.configuration) : null,
      context: quotation.context ? JSON.stringify(quotation.context) : null,
      meta: quotation.meta ? JSON.stringify(quotation.meta) : null,
      log: quotation.log ? JSON.stringify(quotation.log) : null,
      created: quotation.created,
      updated: quotation.updated,
      deleted: null,
    });
  }
}
