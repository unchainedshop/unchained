import { Migration, MigrationRepository } from '@unchainedshop/core';
import { mongodb } from '@unchainedshop/mongodb';
import { AssortmentMediaCollection } from '../db/AssortmentMediaCollection.js';
import { AssortmentsCollection } from '../db/AssortmentsCollection.js';

const convertTagsToLowerCase = async (collection: mongodb.Collection<any>) => {
  let bulk = collection.initializeUnorderedBulkOp();
  let count = 0;

  const cursor = await collection.find({ tags: { $regex: '.*[A-Z]' } });
  // eslint-disable-next-line no-restricted-syntax
  for await (const doc of cursor) {
    const transformedTags = doc.tags.map((tag) => tag.toLowerCase());
    count += 1;
    bulk.find({ _id: doc._id }).updateOne({ $set: { tags: transformedTags } });
    if (count % 500 === 0) {
      bulk.execute();
      bulk = collection.initializeUnorderedBulkOp();
      count = 0;
    }
  }
  if (count > 0) bulk.execute();
};

export default function addMigrations(repository: MigrationRepository<Migration>) {
  repository?.register({
    id: 20220216000000,
    name: 'Move _cachedProductIds cache to own collection in order to save a lot of bandwidth',
    up: async () => {
      const { Assortments, AssortmentProductIdCache } = await AssortmentsCollection(repository.db);
      const assortments = await Assortments.find(
        { _cachedProductIds: { $exists: true }, deleted: null },
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
          } catch {
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
      const { AssortmentMedia } = await AssortmentMediaCollection(repository.db);
      await Promise.all([
        convertTagsToLowerCase(Assortments),
        convertTagsToLowerCase(AssortmentProducts),
        convertTagsToLowerCase(AssortmentLinks),
        convertTagsToLowerCase(AssortmentFilters),
        convertTagsToLowerCase(AssortmentMedia),
      ]);
    },
  });
}
