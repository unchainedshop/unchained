import type { UnchainedCore } from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';
import { generateDbFilterById, type MigrationRepository } from '@unchainedshop/mongodb';
import { createMigrationRunner } from './createMigrationRunner.ts';

export const runMigrations = async ({
  migrationRepository,
  logger = createLogger('unchained:migrations'),
  unchainedAPI,
}: {
  migrationRepository: MigrationRepository<UnchainedCore>;
  logger?: any;
  unchainedAPI: UnchainedCore;
}) => {
  const LastMigration = migrationRepository.db.collection<{
    _id: string;
    action: string;
    category: string;
    timestamp: Date;
  }>('last-migration');

  const findCurrentId = async () => {
    const last = await LastMigration.findOne({ category: 'unchained' }, { sort: { _id: -1 } });
    const id = last ? last._id : 0;
    logger.debug(`Most recent migration id: ${id}`);
    return id;
  };

  const onMigrationComplete = async (id: string, action: string) => {
    await LastMigration.updateOne(
      generateDbFilterById(id, { category: 'unchained' }),
      {
        $set: {
          _id: id,
          action,
          category: 'unchained',
          timestamp: new Date(),
        },
      },
      {
        upsert: true,
      },
    );
    logger.info(`Migrated '${action}' to ${id}`);
    return id;
  };

  const currentId = await findCurrentId();
  const runner = createMigrationRunner({
    currentId,
    logger,
    migrationRepository,
    onMigrationComplete,
    unchainedAPI,
  });

  const [lastMigrationId, operationCount] = await runner.run();

  if (operationCount !== null) {
    if (operationCount > 0) {
      logger.info(`All ${operationCount} migrations completed with most recent id: ${lastMigrationId}`);
    } else {
      logger.debug(`No migrations run, already at latest id: ${currentId}`);
    }
  } else {
    logger.warn(`Some migrations failed, last successful id: ${lastMigrationId}`);
  }
};
