import { Migration, MigrationRepository } from '@unchainedshop/types/core.js';
import { Db } from '@unchainedshop/types/common.js';

export const createMigrationRepository = (db: Db): MigrationRepository<Migration> => {
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
