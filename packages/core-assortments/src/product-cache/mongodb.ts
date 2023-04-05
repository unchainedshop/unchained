import { mongodb } from '@unchainedshop/mongodb';
import { AssortmentsCollection } from '../db/AssortmentsCollection.js';

const eqSet = (as, bs) => {
  return [...as].join(',') === [...bs].join(',');
};

export default async function mongodbCache(db: mongodb.Db) {
  const { AssortmentProductIdCache } = await AssortmentsCollection(db);

  return {
    async getCachedProductIds(assortmentId) {
      const assortmentProductIdCache = await AssortmentProductIdCache.findOne({
        _id: assortmentId,
      });
      return assortmentProductIdCache?.productIds;
    },
    async setCachedProductIds(assortmentId, productIds) {
      const assortmentProductIdCache = await AssortmentProductIdCache.findOne({
        _id: assortmentId,
      });
      if (
        assortmentProductIdCache &&
        eqSet(new Set(productIds), new Set(assortmentProductIdCache.productIds))
      ) {
        return 0;
      }
      const updateResult = await AssortmentProductIdCache.updateOne(
        { _id: assortmentId },
        {
          $set: {
            productIds,
          },
        },
        { upsert: true },
      );
      return updateResult.modifiedCount;
    },
  };
}
