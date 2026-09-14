import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getEmitHistoryAdapter, setEmitHistoryAdapter } from '@unchainedshop/events';
import { configureEventsModule, type EventsModule } from './configureEventsModule.ts';

describe('event report date ranges', () => {
  let server: MongoMemoryServer;
  let client: MongoClient;
  let events: EventsModule;
  const start = new Date('2099-01-02T00:00:00.000Z');
  const end = new Date('2099-01-04T00:00:00.000Z');

  before(async () => {
    server = await MongoMemoryServer.create();
    client = await MongoClient.connect(server.getUri());
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
