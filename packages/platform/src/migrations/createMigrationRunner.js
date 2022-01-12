import { pipePromises } from 'meteor/unchained:utils';

class MigrationError extends Error {
  constructor(migrationId = null, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MigrationError);
    }

    this.name = 'MigrationError';
    this.migrationId = migrationId;
    this.date = new Date();
  }
}

export const createRepository = () => {
  return {
    migrations: new Map(),
    register(migration) {
      this.migrations.set(migration.id, migration);
    },
    allMigrations() {
      return [...this.migrations.values()].sort((left, right) => {
        return left.id - right.id;
      });
    },
  };
};

export const createMigrationRunner = ({
  repository,
  currentId,
  onMigrationComplete,
  logger = console,
  ...options
}) => ({
  operationFactory(action) {
    const ctx = { logger, ...options };
    return (migration) => async () => {
      try {
        await migration[action](ctx);
        await onMigrationComplete(migration.id, action);
        return migration.id;
      } catch (e) {
        throw new MigrationError(migration.id, e.message);
      }
    };
  },
  isIdAfterCurrentId({ id }) {
    return id > currentId;
  },
  migrateToLatest() {
    return repository
      .allMigrations()
      .filter(this.isIdAfterCurrentId)
      .map(this.operationFactory('up'));
  },
  async run() {
    try {
      const operations = this.migrateToLatest();
      const mostRecentId = await pipePromises(operations)(currentId);
      return [mostRecentId, operations.length];
    } catch (e) {
      logger.error(e.name, e);
      return [e.migrationId, null];
    }
  },
});
