import { Migration } from '@unchainedshop/types/core';
import { MigrationRepository } from '@unchainedshop/types/common';
import { AssortmentsCollection } from '../db/AssortmentsCollection';

export default function addMigrations(repository: MigrationRepository<Migration>) {
  repository?.register({
    id: 20220216000000,
    name: 'Move _cachedProductIds cache to own collection in order to save a lot of bandwidth',
    up: async () => {
      const { Assortments, AssortmentProductIdCache } = await AssortmentsCollection(repository.db);
      const assortments = await Assortments.find(
        {},
        { projection: { _id: true, _cachedProductIds: true } },
      ).toArray();

      await Promise.all(
        assortments.map(async (assortment) => {
          await AssortmentProductIdCache.updateOne(
            {
              _id: assortment._id as any,
            },
            {
              // eslint-disable-next-line
              // @ts-ignore
              $set: { productIds: assortment._cachedProductIds }, // eslint-disable-line
            },
            {
              upsert: true,
            },
          );
        }),
      );

      await Assortments.updateMany(
        {},
        {
          $unset: { _cachedProductIds: 1 },
        },
      );
    },
  });
}
