import { UnchainedAPI } from '@unchainedshop/types/api';
import { Db } from '@unchainedshop/types/common';
import { createLogger } from 'meteor/unchained:logger';
import { generateDbFilterById } from 'meteor/unchained:utils';
import { createMigrationRunner } from './createMigrationRunner';
import { migrationRepository } from './migrationRepository';

export const runMigrations = async ({
  db,
  logger = createLogger('unchained:migrations'),
  unchainedAPI,
}: {
  db: Db;
  logger?: any;
  unchainedAPI: UnchainedAPI;
}) => {
  const LastMigration = db.collection('last-migration');

  const findCurrentId = async () => {
    const last = await LastMigration.findOne({ category: 'unchained' }, { sort: { _id: -1 } });
    const id = last ? last._id : 0;
    logger.verbose(`Most recent migration id: ${id}`);
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
    logger.verbose(`Migrated '${action}' to ${id}`);
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
      logger.info(`No migrations run, already at latest id: ${currentId}`);
    }
  } else {
    logger.info(`Some migrations failed, last successful id: ${lastMigrationId}`);
  }
};
