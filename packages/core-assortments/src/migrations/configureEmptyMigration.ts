import { Migration } from "@unchainedshop/types/api";
import { MigrationRepository } from "@unchainedshop/types/common";

export const configureEmptyMigration = (repository: MigrationRepository<Migration>) => {
  repository.register({
    id: 202110121200,
    up: async (_context) => {
      // Do migrations
    },
  });
};
