// Helper function to create test events with fresh timestamps
// This ensures timestamps are calculated at seed time, not module load time
function createTestEvents() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

  return [
    {
      _id: 'test-event-1',
      type: 'USER_CREATE',
      created: threeHoursAgo,
      payload: {
        success: true,
        type: 'USER_CREATE',
      },
    },
    {
      _id: 'test-event-2',
      type: 'ORDER_CREATE',
      created: twoHoursAgo,
      payload: {
        orderId: 'order-1',
        total: 100,
        type: 'ORDER_CREATE',
      },
    },
    {
      _id: 'test-event-3',
      type: 'PRODUCT_CREATE',
      created: oneHourAgo,
      payload: {
        productId: 'product-1',
        type: 'PRODUCT_CREATE',
      },
    },
    {
      _id: 'test-event-4',
      type: 'ORDER_CREATE',
      created: now,
      payload: {
        orderId: 'order-2',
        total: 200,
        type: 'ORDER_CREATE',
      },
    },
  ];
}

// These exported constants use getter functions to always return fresh timestamps
// This prevents stale timestamps when tests run at different times
export const TestEvent1 = {
  get _id() {
    return 'test-event-1';
  },
  get type() {
    return 'USER_CREATE';
  },
  get created() {
    return new Date(Date.now() - 3 * 60 * 60 * 1000);
  },
  get payload() {
    return { success: true, type: 'USER_CREATE' };
  },
};

export const TestEvent2 = {
  get _id() {
    return 'test-event-2';
  },
  get type() {
    return 'ORDER_CREATE';
  },
  get created() {
    return new Date(Date.now() - 2 * 60 * 60 * 1000);
  },
  get payload() {
    return { orderId: 'order-1', total: 100, type: 'ORDER_CREATE' };
  },
};

export const TestEvent3 = {
  get _id() {
    return 'test-event-3';
  },
  get type() {
    return 'PRODUCT_CREATE';
  },
  get created() {
    return new Date(Date.now() - 60 * 60 * 1000);
  },
  get payload() {
    return { productId: 'product-1', type: 'PRODUCT_CREATE' };
  },
};

export const TestEvent4 = {
  get _id() {
    return 'test-event-4';
  },
  get type() {
    return 'ORDER_CREATE';
  },
  get created() {
    return new Date();
  },
  get payload() {
    return { orderId: 'order-2', total: 200, type: 'ORDER_CREATE' };
  },
};

export default async function seedEvents(db) {
  // Create fresh events with current timestamps
  const testEvents = createTestEvents();
  for (const event of testEvents) {
    await db.collection('events').findOrInsertOne(event);
  }
}

/**
 * Seed events into the Drizzle database.
 * This directly inserts into the database WITHOUT using the module to avoid side effects.
 * Uses createTestEvents() to ensure fresh timestamps at seed time.
 */
export async function seedEventsToDrizzle(db) {
  const { events } = await import('@unchainedshop/core-events');
  const { sql } = await import('drizzle-orm');

  // Delete all existing events directly
  await db.delete(events);

  // Clear FTS table
  await db.run(sql`DELETE FROM events_fts`);

  // Create fresh events with current timestamps
  const testEvents = createTestEvents();

  // Insert all events directly (bypassing module)
  for (const event of testEvents) {
    await db.insert(events).values({
      _id: event._id,
      type: event.type,
      context: event.context,
      payload: event.payload,
      created: event.created,
    });

    // Manually insert into FTS table
    await db.run(sql`INSERT INTO events_fts(_id, type) VALUES (${event._id}, ${event.type})`);
  }
}
