import { Migration, MigrationRepository } from '@unchainedshop/types/core.js';
import { WorkQueueCollection } from '../../db/WorkQueueCollection.js';

export default function addMigrations(repository: MigrationRepository<Migration>) {
  repository?.register({
    id: 20240905161400,
    name: 'Remove all autoscheduled work items so they get scheduled freshly',
    up: async () => {
      const WorkQueue = await WorkQueueCollection(repository.db);

      await WorkQueue.deleteMany({
        autoscheduled: true,
        started: null,
        deleted: null,
      });
    },
  });
}
