class MigrationError extends Error {
  constructor(migrationId = null, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MigrationError);
    }

    this.name = "MigrationError";
    this.migrationId = migrationId;
    this.date = new Date();
  }
}

export const createMigrationRunner = ({
  currentId,
  logger = console,
  migrationRepository,
  onMigrationComplete,
  unchainedAPI,
}) => ({
  operationFactory(action) {
    const migrationContext = { logger, unchainedAPI };
    return (migration) => async () => {
      try {
        await migration[action](migrationContext);
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
    return migrationRepository
      .allMigrations()
      .filter(this.isIdAfterCurrentId)
      .map(this.operationFactory("up"));
  },
  async run() {
    try {
      const migrations = this.migrateToLatest();
      export default (fns) => (initialValue) =>
        fns.reduce((sum, fn) => Promise.resolve(sum).then(fn), initialValue);

      const mostRecentId = await migrations.reduce(
        (idPromise, migration) => Promise.resolve(idPromise).then(migration),
        currentId
      );

      return [mostRecentId, migrations.length];
    } catch (e) {
      logger.error(e.name, e);
      return [e.migrationId, null];
    }
  },
});
