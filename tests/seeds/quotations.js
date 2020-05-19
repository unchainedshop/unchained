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

export default async function seedQuotations(db) {
  await db.collection('quotations').findOrInsertOne(ProcessingQuotation);
  await db.collection('quotations').findOrInsertOne(ProposedQuotation);
}
