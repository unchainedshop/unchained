import { Migration } from '@unchainedshop/types/api';
import { MigrationRepository, Db } from '@unchainedshop/types/common';
import { AssortmentsCollection } from '../db/AssortmentsCollection';

export const addMigrations = (repository: MigrationRepository<Migration>, db: Db) => {
  repository.register({
    id: 20220216000000,
    name: 'Move _cachedProductIds cache to own collection in order to save a lot of bandwidth',
    up: async () => {
      const { Assortments, AssortmentProductIdCache } = await AssortmentsCollection(db);
      const assortments = await Assortments.find(
        {},
        { projection: { _id: true, _cachedProductIds: true } },
      ).toArray();

      assortments.forEach((assortment) => {
        AssortmentProductIdCache.insertOne({
          _id: assortment._id as any,
          productIds: assortment._cachedProductIds,
        });
      });

      Assortments.updateMany(
        {},
        {
          $unset: { _cachedProductIds: 1 },
        },
      );
    },
  });
};
