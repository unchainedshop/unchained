export const ActiveSubscription = {
  _id: 'activesubscription',
  status: 'ACTIVE',
  created: new Date(),
  isExpired: false,
  subscriptionNumber: 'RANDOME',
  userId: 'admin',
  productId: 'plan-product',
  periods: [
    {
      orderId: 'simple-order',
      start: new Date(),
      end: 1603399340999,
      isTrial: false,
    },
  ],
  countryCode: 'ch',
  currencyCode: 'CHF',
  quantity: 2,
};

export const InitialSubscription = {
  _id: 'initialsubscription',
  status: 'INITIAL',
  created: new Date(),
  isExpired: false,
  periods: [
    {
      orderId: 'simple-order',
      start: new Date(),
      end: 1603399340999,
      isTrial: false,
    },
  ],
  subscriptionNumber: 'RANDOME-Initial',
  userId: 'admin',
  countryId: 'ch',
  currencyId: 'chf',
  quantity: 1,
  productId: 'plan-product',
};

export const InitialSubscriptionWithWrongPlan = {
  _id: 'initialsubscription-wrong-plan',
  status: 'INITIAL',
  created: new Date(),
  isExpired: false,
  periods: [
    {
      orderId: 'simple-order',
      start: new Date(),
      end: 1603399340999,
      isTrial: false,
    },
  ],
  subscriptionNumber: 'RANDOME-wrong',
  userId: 'admin',
  countryId: 'ch',
  currencyId: 'chf',
  quantity: 1,
  productId: 'simpleproduct',
};

export default async function seedSubscription(db) {
  await db.collection('subscriptions').findOrInsertOne(ActiveSubscription);
  await db.collection('subscriptions').findOrInsertOne(InitialSubscription);
  await db
    .collection('subscriptions')
    .findOrInsertOne(InitialSubscriptionWithWrongPlan);
}
