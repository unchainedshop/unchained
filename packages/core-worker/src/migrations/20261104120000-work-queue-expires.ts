import type { MigrationRepository } from '@unchainedshop/mongodb';
import { WORK_RETENTION_SECONDS, WorkQueueCollection } from '../db/WorkQueueCollection.ts';

/**
 * Work used to be deleted by a TTL index on `created` (`created_-1`, 30 days), so work scheduled
 * more than 30 days ahead was deleted before it ran. New work carries an `expires` date (see
 * computeWorkExpiry) that a TTL index on `expires` acts on. Give existing work the same date, and
 * only then drop the old TTL index, so no work is left without an expiry in between.
 * Both steps can run again.
 */
export default function migrateWorkQueueExpiry(repository: MigrationRepository) {
  repository?.register({
    id: 20261104120000,
    name: 'Expire work 30 days after it was created or is scheduled, whichever is later',
    up: async ({ logger }) => {
      const WorkQueue = await WorkQueueCollection(repository.db);

      const { modifiedCount } = await WorkQueue.updateMany({ expires: { $exists: false } }, [
        {
          $set: {
            // Like computeWorkExpiry, work without dates expires 30 days from now
            expires: {
              $add: [
                { $ifNull: [{ $max: ['$created', '$scheduled'] }, '$$NOW'] },
                WORK_RETENTION_SECONDS * 1000,
              ],
            },
          },
        },
      ]);

      const legacyTTLIndexNames = (await WorkQueue.indexes())
        .filter(
          ({ key, expireAfterSeconds }) =>
            expireAfterSeconds !== undefined && Object.keys(key).join() === 'created',
        )
        .map(({ name }) => name as string);

      for (const name of legacyTTLIndexNames) {
        try {
          await WorkQueue.dropIndex(name);
        } catch (error) {
          // Another worker instance running the same migration dropped it first
          if (error?.codeName !== 'IndexNotFound') throw error;
        }
      }

      logger?.info(
        `Work queue expiry: ${modifiedCount} work item(s) got an expiry, dropped TTL index(es) on created: ${legacyTTLIndexNames.join(', ') || 'none'}`,
      );
    },
  });
}
