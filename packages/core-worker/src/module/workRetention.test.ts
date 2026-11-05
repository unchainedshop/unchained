import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { type Db, MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Migration } from '@unchainedshop/mongodb';
import { configureWorkerModule } from './configureWorkerModule.ts';
import { computeWorkExpiry, WORK_RETENTION_SECONDS, type Work } from '../db/WorkQueueCollection.ts';

const DAY = 24 * 60 * 60 * 1000;
const RETENTION = WORK_RETENTION_SECONDS * 1000;

describe('Work queue retention', { timeout: 30000 }, () => {
  let server: MongoMemoryServer | undefined;
  let client: MongoClient;
  let db: Db;
  let migrations: Map<number, Migration>;

  const WorkQueue = () => db.collection<Work>('work_queue');

  const configure = async () => {
    migrations = new Map();
    return configureWorkerModule({
      db,
      migrationRepository: {
        db,
        migrations,
        register: (migration) => migrations.set(migration.id, migration),
        allMigrations: () => [...migrations.values()],
      },
    });
  };

  const indexesByName = async () =>
    Object.fromEntries((await WorkQueue().indexes()).map((index) => [index.name, index]));

  before(async () => {
    // Use MONGO_URL (npm test shares the run's MongoDB), else start a server of its own
    server = process.env.MONGO_URL ? undefined : await MongoMemoryServer.create();
    client = await MongoClient.connect(process.env.MONGO_URL || server!.getUri());
    db = client.db('worker-retention-test');
  });

  beforeEach(async () => {
    // Drop the collection, not only its documents: the tests check its indexes
    await WorkQueue()
      .drop()
      .catch(() => undefined);
  });

  after(async () => {
    await client.close();
    await server?.stop();
  });

  describe('expires', () => {
    it('expires with a TTL index on expires instead of created', async () => {
      await configure();

      const indexes = await indexesByName();
      assert.equal(indexes.expires_1.expireAfterSeconds, 0);
      assert.equal(indexes.created_1.expireAfterSeconds, undefined);
      assert.equal(indexes['created_-1'], undefined);
    });

    it('computes the expiry from the later of created and scheduled', () => {
      const created = new Date('2026-11-01T00:00:00Z');
      const scheduled = new Date('2027-02-01T00:00:00Z');

      assert.equal(computeWorkExpiry({ created, scheduled }).getTime(), scheduled.getTime() + RETENTION);
      assert.equal(
        computeWorkExpiry({ created: scheduled, scheduled: created }).getTime(),
        scheduled.getTime() + RETENTION,
      );
      assert.equal(computeWorkExpiry({ created }).getTime(), created.getTime() + RETENTION);
      // Work passed without its dates (e.g. a partial work to rescheduleWork) gets a valid date
      assert.equal(computeWorkExpiry({ scheduled }).getTime(), scheduled.getTime() + RETENTION);
      assert.ok(computeWorkExpiry({}).getTime() >= Date.now() + RETENTION - 1000);
    });

    it('keeps far-future work until 30 days after it is scheduled', async () => {
      const worker = await configure();
      const scheduled = new Date(Date.now() + 90 * DAY);

      const work = await worker.addWork({ type: 'EMAIL', scheduled });

      assert.equal(work.expires?.getTime(), scheduled.getTime() + RETENTION);
    });

    it('keeps other work until 30 days after it is created', async () => {
      const worker = await configure();

      const now = await worker.addWork({ type: 'EMAIL' });
      const past = await worker.addWork({
        type: 'EMAIL',
        scheduled: new Date(Date.now() - 5 * DAY),
      });

      assert.equal(now.expires?.getTime(), now.created.getTime() + RETENTION);
      assert.equal(past.expires?.getTime(), past.created.getTime() + RETENTION);
    });

    it('moves the expiry when work is rescheduled', async () => {
      const worker = await configure();
      const work = await worker.addWork({ type: 'EMAIL' });
      const scheduled = new Date(Date.now() + 60 * DAY);

      const rescheduled = await worker.rescheduleWork(work, scheduled);

      assert.equal(rescheduled?.expires?.getTime(), scheduled.getTime() + RETENTION);
    });

    it('keeps autoscheduled far-future work until 30 days after it is scheduled', async () => {
      const worker = await configure();
      const scheduled = new Date(Date.now() + 45 * DAY);

      const work = await worker.ensureOneWork({
        type: 'INVALIDATE_CARTS',
        scheduled,
        scheduleId: 'INVALIDATE_CARTS',
      });

      assert.equal(work?.expires?.getTime(), scheduled.getTime() + RETENTION);
    });
  });

  describe('migration 20261104120100', () => {
    // Relative to now: MongoDB's TTL monitor would delete expired fixtures during the test
    const created = new Date(Date.now() - 10 * DAY);
    const farFuture = new Date(Date.now() + 120 * DAY);

    const setupLegacyQueue = async () => {
      await WorkQueue().createIndex({ created: -1 }, { expireAfterSeconds: WORK_RETENTION_SECONDS });
      await WorkQueue().insertMany([
        { _id: 'due', type: 'EMAIL', created, scheduled: created } as Work,
        {
          _id: 'far-future',
          type: 'EMAIL',
          created,
          scheduled: farFuture,
        } as Work,
        {
          _id: 'already-migrated',
          type: 'EMAIL',
          created,
          scheduled: created,
          expires: new Date('2030-01-01T00:00:00Z'),
        } as Work,
        { _id: 'undated', type: 'EMAIL' } as Work,
      ]);
    };

    it('boots next to the TTL index of older versions without rebuilding the indexes', async () => {
      await setupLegacyQueue();

      await configure();

      const indexes = await indexesByName();
      assert.equal(indexes['created_-1'].expireAfterSeconds, WORK_RETENTION_SECONDS);
      assert.ok(indexes.expires_1);
      assert.ok(indexes.created_1);
      assert.ok(indexes.workqueue_fulltext_search);
    });

    it('backfills expires and drops the TTL index on created', async () => {
      await setupLegacyQueue();
      await configure();
      const migration = migrations.get(20261104120100);
      assert.ok(migration, 'core-worker registers the expiry migration');

      await migration.up({ logger: undefined, unchainedAPI: undefined });

      const works = Object.fromEntries(
        (await WorkQueue().find({}).toArray()).map((work) => [work._id, work.expires]),
      );
      assert.equal(works.due?.getTime(), created.getTime() + RETENTION);
      assert.equal(works['far-future']?.getTime(), farFuture.getTime() + RETENTION);
      assert.equal(works['already-migrated']?.getTime(), new Date('2030-01-01T00:00:00Z').getTime());
      assert.ok(works.undated!.getTime() >= Date.now() + RETENTION - 60 * 1000);

      const indexes = await indexesByName();
      assert.equal(indexes['created_-1'], undefined);
      assert.equal(indexes.expires_1.expireAfterSeconds, 0);
      assert.ok(indexes.workqueue_fulltext_search);

      // Running it again, e.g. on a second worker instance, does not fail
      await migration.up({ logger: undefined, unchainedAPI: undefined });
    });
  });

  describe('scrubWorkInput', () => {
    const finishedWork = async (
      worker: Awaited<ReturnType<typeof configure>>,
      type: string,
      input: Record<string, any>,
      finished: Date,
    ) => {
      const work = await worker.addWork({ type, input });
      await worker.allocateWork({ types: [type], worker: 'test' });
      await worker.finishWork(work._id, { success: true, finished, worker: 'test' });
      return work;
    };

    it('scrubs the input of work finished or deleted before the date', async () => {
      const worker = await configure();
      const twoDaysAgo = new Date(Date.now() - 2 * DAY);
      const input = { to: 'buyer@example.com', text: 'https://shop.example/reset/plain-token' };

      const sent = await finishedWork(worker, 'EMAIL', input, twoDaysAgo);
      const recent = await finishedWork(worker, 'EMAIL', input, new Date());
      const message = await finishedWork(
        worker,
        'MESSAGE',
        { template: 'ACCOUNT_ACTION', token: 'plain-token' },
        twoDaysAgo,
      );
      const otherType = await finishedWork(worker, 'HTTP_REQUEST', input, twoDaysAgo);
      const pending = await worker.addWork({ type: 'EMAIL', input });
      const deleted = await worker.addWork({ type: 'EMAIL', input });
      await worker.deleteWork(deleted._id);
      await WorkQueue().updateOne({ _id: deleted._id }, { $set: { deleted: twoDaysAgo } });

      const scrubbedCount = await worker.scrubWorkInput({
        types: ['EMAIL', 'MESSAGE'],
        before: new Date(Date.now() - DAY),
        keep: ['template'],
      });

      assert.equal(scrubbedCount, 3);
      const stored = async (workId: string) => worker.findWork({ workId });
      assert.deepEqual((await stored(sent._id))?.input, {});
      assert.ok((await stored(sent._id))?.scrubbed instanceof Date);
      assert.deepEqual((await stored(message._id))?.input, { template: 'ACCOUNT_ACTION' });
      assert.deepEqual((await stored(deleted._id))?.input, {});
      for (const work of [recent, otherType, pending]) {
        const { input: storedInput, scrubbed } = (await stored(work._id))!;
        assert.deepEqual(storedInput, work.input);
        assert.equal(scrubbed, undefined);
      }

      // Already scrubbed work is left alone
      assert.equal(await worker.scrubWorkInput({ types: ['EMAIL', 'MESSAGE'], before: new Date() }), 1);
      assert.deepEqual((await stored(message._id))?.input, { template: 'ACCOUNT_ACTION' });
    });

    it('scrubs work without an object input', async () => {
      const worker = await configure();
      const work = await finishedWork(worker, 'EMAIL', {}, new Date(Date.now() - DAY));
      await WorkQueue().updateOne({ _id: work._id }, { $set: { input: null as any } });

      assert.equal(await worker.scrubWorkInput({ types: ['EMAIL'], before: new Date() }), 1);
      assert.deepEqual((await worker.findWork({ workId: work._id }))?.input, {});
    });
  });
});
