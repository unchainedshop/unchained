const now = new Date();
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

export const TestEvent1 = {
  _id: 'test-event-1',
  type: 'USER_CREATE',
  created: threeHoursAgo,
  payload: {
    success: true,
    type: 'USER_CREATE',
  },
};

export const TestEvent2 = {
  _id: 'test-event-2',
  type: 'ORDER_CREATE',
  created: twoHoursAgo,
  payload: {
    orderId: 'order-1',
    total: 100,
    type: 'ORDER_CREATE',
  },
};

export const TestEvent3 = {
  _id: 'test-event-3',
  type: 'PRODUCT_CREATE',
  created: oneHourAgo,
  payload: {
    productId: 'product-1',
    type: 'PRODUCT_CREATE',
  },
};

export const TestEvent4 = {
  _id: 'test-event-4',
  type: 'ORDER_CREATE',
  created: now,
  payload: {
    orderId: 'order-2',
    total: 200,
    type: 'ORDER_CREATE',
  },
};

export default async function seedEvents(db) {
  await db.collection('events').findOrInsertOne(TestEvent1);
  await db.collection('events').findOrInsertOne(TestEvent2);
  await db.collection('events').findOrInsertOne(TestEvent3);
  await db.collection('events').findOrInsertOne(TestEvent4);
}
