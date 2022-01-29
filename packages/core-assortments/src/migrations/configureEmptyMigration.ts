import { Migration } from "@unchainedshop/types/api";
import { MigrationRepository } from "@unchainedshop/types/common";

export const configureEmptyMigration = (
  repository: MigrationRepository<Migration>
) => {
  repository.register({
    id: 20220129213500,
    up: async ({ logger }) => {
      // Do migrations
      logger.info("RUN EMPTY ASSORTMENT MIGRATION");
    },
  });
};
