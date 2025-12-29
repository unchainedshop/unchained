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

const TestEvents = [TestEvent1, TestEvent2, TestEvent3, TestEvent4];

export default async function seedEvents(db) {
  await db.collection('events').findOrInsertOne(TestEvent1);
  await db.collection('events').findOrInsertOne(TestEvent2);
  await db.collection('events').findOrInsertOne(TestEvent3);
  await db.collection('events').findOrInsertOne(TestEvent4);
}

/**
 * Seed events into the Drizzle database.
 * This directly inserts into the database WITHOUT using the module to avoid side effects.
 */
export async function seedEventsToDrizzle(db) {
  const { events } = await import('@unchainedshop/core-events');
  const { sql } = await import('drizzle-orm');

  // Delete all existing events directly
  await db.delete(events);

  // Clear FTS table
  await db.run(sql`DELETE FROM events_fts`);

  // Insert all events directly (bypassing module)
  for (const event of TestEvents) {
    await db.insert(events).values({
      _id: event._id,
      type: event.type,
      context: event.context,
      payload: event.payload,
      created: event.created,
    });

    // Manually insert into FTS table (triggers handle this for normal inserts,
    // but we want to be explicit here)
    await db.run(sql`INSERT INTO events_fts(_id, type) VALUES (${event._id}, ${event.type})`);
  }
}
