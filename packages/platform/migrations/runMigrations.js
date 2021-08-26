import { Mongo } from 'meteor/mongo';
import { createLogger } from 'meteor/unchained:core-logger';
import createMigrationRunner from './createMigrationRunner';

const LastMigration = new Mongo.Collection('last_migration');

export default async (
  repository,
  { logger = createLogger('unchained:migrations'), ...options } = {}
) => {
  const findCurrentId = async () => {
    const last = LastMigration.findOne(
      { category: 'unchained' },
      { sort: { _id: -1 } }
    );
    const id = last ? last._id : 0;
    logger.verbose(`Most recent migration id: ${id}`);
    return id;
  };

  const onMigrationComplete = async (id, action) => {
    LastMigration.upsert(
      { _id: id, category: 'unchained' },
      {
        $set: {
          _id: id,
          action,
          category: 'unchained',
          timestamp: new Date(),
        },
      }
    );
    logger.verbose(`Migrated '${action}' to ${id}`);
    return id;
  };

  const currentId = await findCurrentId();
  const runner = createMigrationRunner({
    repository,
    currentId,
    onMigrationComplete,
    logger,
    ...options,
  });
  const [lastMigrationId, operationCount] = await runner.run();
  if (operationCount !== null) {
    if (operationCount > 0) {
      logger.info(
        `All ${operationCount} migrations completed with most recent id: ${lastMigrationId}`
      );
    } else {
      logger.info(`No migrations run, already at latest id: ${currentId}`);
    }
  } else {
    logger.info(
      `Some migrations failed, last successful id: ${lastMigrationId}`
    );
  }
};
