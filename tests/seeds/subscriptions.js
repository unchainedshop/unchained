export const ActiveSubscription = {
  _id: 'activesubscription',
  status: 'INITIAL',
  created: new Date(),
  isExpired: false,
  subscriptionNumber: 'RANDOME',
  userId: 'admin',
  productId: 'simpleproduct',
  period: [
    {
      orderId: 'simple-order',
      start: 1603399340831,
      end: 1603399340999,
    },
  ],
  countryCode: 'ch',
  currencyCode: 'CHF',
  quantity: 2,
};

/* export const InitialSubscription = {
  _id: 'initialsubscription',
  status: 'INITIAL',
  created: 1603394564831,
  updated: 1601234555841,
  isExpired: false,
  subscriptionNumber: 'RANDOME-Initial',
  userId: 'admin',
  countryId: 'ch',
  currency: 'chf',
}; */

export default async function seedSubscription(db) {
  await db.collection('subscriptions').findOrInsertOne(ActiveSubscription);

  /* await db.collection('subscriptions').findOrInsertOne(InitialSubscription); */
}
