import { mongodb, Migration, MigrationRepository } from '@unchainedshop/mongodb';

export const createMigrationRepository = (db: mongodb.Db): MigrationRepository => {
  const migrations = new Map();
  return {
    db,
    migrations,
    register: (migration: Migration) => {
      migrations.set(migration.id, migration);
    },
    allMigrations: () => {
      return [...migrations.values()].sort((left, right) => {
        return left.id - right.id;
      });
    },
  };
};
