import { Migration, MigrationRepository } from '@unchainedshop/types/core';
import { convertTagsToLowerCase } from '@unchainedshop/utils';
import { AssortmentMediaCollection } from '../db/AssortmentMediasCollection';
import { AssortmentsCollection } from '../db/AssortmentsCollection';

export default function addMigrations(repository: MigrationRepository<Migration>) {
  repository?.register({
    id: 20220216000000,
    name: 'Move _cachedProductIds cache to own collection in order to save a lot of bandwidth',
    up: async () => {
      const { Assortments, AssortmentProductIdCache } = await AssortmentsCollection(repository.db);
      const assortments = await Assortments.find(
        { _cachedProductIds: { $exists: true } },
        { projection: { _id: true, _cachedProductIds: true } },
      ).toArray();

      await Promise.all(
        assortments.map(async (assortment) => {
          try {
            // eslint-disable-next-line
            // @ts-ignore
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
          } catch (e) {
            console.warn(e);
            /* */
          }
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
  repository?.register({
    id: 20220920122700,
    name: 'Convert all tags to lower case to make it easy for search',
    up: async () => {
      const { Assortments, AssortmentFilters, AssortmentLinks, AssortmentProducts } =
        await AssortmentsCollection(repository.db);
      const { AssortmentMedias } = await AssortmentMediaCollection(repository.db);
      await Promise.all([
        convertTagsToLowerCase(Assortments),
        convertTagsToLowerCase(AssortmentProducts),
        convertTagsToLowerCase(AssortmentLinks),
        convertTagsToLowerCase(AssortmentFilters),
        convertTagsToLowerCase(AssortmentMedias),
      ]);
    },
  });
}
