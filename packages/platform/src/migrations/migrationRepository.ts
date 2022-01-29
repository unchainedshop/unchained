import { Migration } from "@unchainedshop/types/api";
import { MigrationRepository } from "@unchainedshop/types/common";

export const migrationRepository: MigrationRepository<Migration> = {
  migrations: new Map(),
  register: (migration: Migration) => {
    migrationRepository.migrations.set(migration.id, migration);
  },
  allMigrations: () => {
    return [...migrationRepository.migrations.values()].sort((left, right) => {
      return left.id - right.id;
    });
  },
};
