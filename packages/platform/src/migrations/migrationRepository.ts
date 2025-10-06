import { mongodb, Migration, MigrationRepository } from '@unchainedshop/mongodb';

export const createMigrationRepository = (db: mongodb.Db): MigrationRepository => {
  const migrations = new Map();
  return {
    db,
    migrations,
    register: (migration: Migration) => {
      if (migration.id < 19700000000000 || migration.id >= 100000000000000) {
        throw new Error(
          `Migration ID must be between 19700000000000 and 99999999999999, got ${migration.id}`,
        );
      }
      migrations.set(migration.id, migration);
    },
    allMigrations: () => {
      return [...migrations.values()].toSorted((left, right) => {
        return left.id - right.id;
      });
    },
  };
};
