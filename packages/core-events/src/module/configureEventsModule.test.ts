import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { after, before, describe, it } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  emit,
  getEmitAdapter,
  getEmitHistoryAdapter,
  registerEvents,
  setEmitAdapter,
  setEmitHistoryAdapter,
  subscribe,
  type EmitAdapter,
} from '@unchainedshop/events';
import {
  configureEventsModule,
  type EventsModule,
  type EventsSettingsOptions,
} from './configureEventsModule.ts';

describe('event report date ranges', () => {
  let server: MongoMemoryServer | undefined;
  let client: MongoClient;
  let events: EventsModule;
  const start = new Date('2099-01-02T00:00:00.000Z');
  const end = new Date('2099-01-04T00:00:00.000Z');

  before(async () => {
    // Use MONGO_URL (npm test shares the run's MongoDB), else start a server of its own
    server = process.env.MONGO_URL ? undefined : await MongoMemoryServer.create();
    client = await MongoClient.connect(process.env.MONGO_URL || server.getUri());
    const historyAdapter = getEmitHistoryAdapter();
    try {
      events = await configureEventsModule({ db: client.db('event-report-test') });
    } finally {
      setEmitHistoryAdapter(historyAdapter);
    }
    await Promise.all(
      [
        ['before', 'ORDER_CREATE', '2099-01-01'],
        ['start', 'ORDER_CREATE', '2099-01-02'],
        ['inside', 'ORDER_CREATE', '2099-01-03'],
        ['end', 'ORDER_CREATE', '2099-01-04'],
        ['after', 'ORDER_CREATE', '2099-01-05'],
        ['other-type', 'PRODUCT_CREATE', '2099-01-03'],
      ].map(([_id, type, day]) => events.create({ _id, type, created: new Date(`${day}T00:00:00Z`) })),
    );
  });

  after(async () => {
    await client?.close();
    await server?.stop();
  });

  it('includes both boundaries and excludes events outside a bounded range', async () => {
    const report = await events.getReport({ dateRange: { start, end }, types: ['ORDER_CREATE'] });

    assert.deepEqual(
      report.map(({ type, emitCount }) => ({ type, emitCount })),
      [{ type: 'ORDER_CREATE', emitCount: 3 }],
    );
  });

  it('supports either date boundary independently', async () => {
    for (const dateRange of [{ start }, { end }]) {
      const report = await events.getReport({ dateRange, types: ['ORDER_CREATE'] });
      assert.equal(report[0].emitCount, 4);
    }
  });

  it('preserves type filtering without a date range', async () => {
    const report = await events.getReport({ types: ['ORDER_CREATE'] });
    assert.deepEqual(
      report.map(({ type, emitCount }) => ({ type, emitCount })),
      [{ type: 'ORDER_CREATE', emitCount: 5 }],
    );
  });
});

describe('event history redaction', () => {
  const EVENT = 'EVENT_HISTORY_REDACTION_TEST';
  let server: MongoMemoryServer | undefined;
  let client: MongoClient;
  // A throwaway emitter keeps the subscription away from the events of other suites
  const emitter = new EventEmitter();
  const emitAdapter: EmitAdapter = {
    publish: (eventName, data) => emitter.emit(eventName, data),
    subscribe: (eventName, callback) => emitter.on(eventName, callback),
  };
  const received: Record<string, any>[] = [];

  const emitted = () => ({
    action: 'reset-password',
    userId: 'user-1',
    address: 'ada@example.com',
    token: 'plain-token',
    when: new Date('2099-01-01T00:00:00.000Z'),
    credentials: { PlainPassword: 'plain-password', hashedToken: 'hashed-token' },
    order: {
      _id: 'order-1',
      contact: { emailAddress: 'ada@example.com', telNumber: '+41 79 000 00 00' },
      billingAddress: { firstName: 'Ada', lastName: 'Lovelace', city: 'Zürich', countryCode: 'CH' },
    },
  });

  // Emits through a history adapter of a module configured with the options. The previous
  // adapters are restored right after the (synchronous) publish, so other suites keep theirs.
  const emitAndStore = async (options?: EventsSettingsOptions) => {
    const db = client.db('event-history-redaction-test');
    await db.collection('events').deleteMany({});
    const previousAdapter = getEmitAdapter();
    const previousHistoryAdapter = getEmitHistoryAdapter();
    const payload = emitted();
    let historyAdapter: EmitAdapter;
    try {
      setEmitHistoryAdapter(undefined as unknown as EmitAdapter);
      await configureEventsModule({ db, options } as any);
      historyAdapter = getEmitHistoryAdapter();
      setEmitAdapter(emitAdapter);
      received.length = 0;
      await emit(EVENT, payload);
    } finally {
      setEmitAdapter(previousAdapter);
      setEmitHistoryAdapter(previousHistoryAdapter);
    }
    assert.notEqual(historyAdapter, previousHistoryAdapter);

    // The history is written asynchronously
    let stored: any = null;
    for (let attempt = 0; attempt < 50 && !stored; attempt += 1) {
      stored = await db.collection('events').findOne({ type: EVENT });
      if (!stored) await setTimeout(10);
    }
    assert.ok(stored, 'event should be stored');
    return { payload, stored: stored.payload };
  };

  before(async () => {
    // Use MONGO_URL (npm test shares the run's MongoDB), else start a server of its own
    server = process.env.MONGO_URL ? undefined : await MongoMemoryServer.create();
    client = await MongoClient.connect(process.env.MONGO_URL || server!.getUri());
    registerEvents([EVENT]);
    const previousAdapter = getEmitAdapter();
    setEmitAdapter(emitAdapter);
    try {
      subscribe(EVENT, ({ payload }) => {
        received.push(payload);
      });
    } finally {
      setEmitAdapter(previousAdapter);
    }
  });

  after(async () => {
    await client?.close();
    await server?.stop();
  });

  it('redacts the default secrets in the history and keeps the emitted payload', async () => {
    const { payload, stored } = await emitAndStore();

    assert.deepEqual(stored, {
      ...emitted(),
      token: '******',
      credentials: { PlainPassword: '******', hashedToken: '******' },
    });
    assert.ok(stored.when instanceof Date);

    // Subscribers get the emitted object itself, unchanged
    assert.equal(received.length, 1);
    assert.equal(received[0], payload);
    assert.deepEqual(payload, emitted());
  });

  it('redacts contact data with redactContactData', async () => {
    const { payload, stored } = await emitAndStore({ redactContactData: true });

    assert.deepEqual(stored, {
      ...emitted(),
      address: '******',
      token: '******',
      credentials: { PlainPassword: '******', hashedToken: '******' },
      order: {
        _id: 'order-1',
        contact: { emailAddress: '******', telNumber: '******' },
        billingAddress: {
          firstName: '******',
          lastName: '******',
          city: '******',
          countryCode: 'CH',
        },
      },
    });
    assert.deepEqual(received[0], emitted());
    assert.deepEqual(payload, emitted());
  });

  it('redacts the configured fields instead of the defaults', async () => {
    const { stored } = await emitAndStore({ redactedPayloadFields: ['ACTION'] });
    assert.deepEqual(stored, { ...emitted(), action: '******' });
  });

  it('stores the payload as emitted with an empty list', async () => {
    const { stored } = await emitAndStore({ redactedPayloadFields: [] });
    assert.deepEqual(stored, emitted());
  });

  it('adds contact data to a configured list', async () => {
    const { stored } = await emitAndStore({ redactedPayloadFields: [], redactContactData: true });
    assert.equal(stored.token, 'plain-token');
    assert.equal(stored.address, '******');
    assert.deepEqual(stored.order.contact, { emailAddress: '******', telNumber: '******' });
  });
});
