import { log } from 'meteor/unchained:logger';
import { AssortmentProducts, AssortmentLinks, AssortmentFilters, Assortments } from './db/assortments';

export default (repository) => {
  repository.register({
    id: 202110121200,
    async up() {
      //
      const assortmentProductIds = (
        await AssortmentProducts.rawCollection()
          .aggregate(
            [
              {
                $match: {},
              },
              {
                $lookup: {
                  from: 'assortments',
                  localField: 'assortmentId',
                  foreignField: '_id',
                  as: 'assortments',
                },
              },
              {
                $lookup: {
                  from: 'products',
                  localField: 'productId',
                  foreignField: '_id',
                  as: 'products',
                },
              },
              {
                $match: {
                  $or: [{ assortments: { $size: 0 } }, { products: { $size: 0 } }],
                },
              },
            ],
            {
              allowDiskUse: true,
            },
          )
          .toArray()
      ).map((a) => a._id);

      AssortmentProducts.removeProducts(
        { _id: { $in: assortmentProductIds } },
        { skipInvalidation: true },
      );

      const assortmentLinkIds = (
        await AssortmentLinks.rawCollection()
          .aggregate(
            [
              {
                $match: {},
              },
              {
                $lookup: {
                  from: 'assortments',
                  localField: 'childAssortmentId',
                  foreignField: '_id',
                  as: 'childAssortments',
                },
              },
              {
                $lookup: {
                  from: 'assortments',
                  localField: 'parentAssortmentId',
                  foreignField: '_id',
                  as: 'parentAssortments',
                },
              },
              {
                $match: {
                  $or: [{ childAssortments: { $size: 0 } }, { parentAssortments: { $size: 0 } }],
                },
              },
            ],
            {
              allowDiskUse: true,
            },
          )
          .toArray()
      ).map((a) => a._id);

      AssortmentLinks.removeLinks({ _id: { $in: assortmentLinkIds } }, { skipInvalidation: true });

      const assortmentFilterIds = (
        await AssortmentFilters.rawCollection()
          .aggregate(
            [
              {
                $match: {},
              },
              {
                $lookup: {
                  from: 'assortments',
                  localField: 'assortmentId',
                  foreignField: '_id',
                  as: 'assortments',
                },
              },
              {
                $lookup: {
                  from: 'filters',
                  localField: 'filterId',
                  foreignField: '_id',
                  as: 'filters',
                },
              },
              {
                $match: {
                  $or: [{ assortments: { $size: 0 } }, { filters: { $size: 0 } }],
                },
              },
            ],
            {
              allowDiskUse: true,
            },
          )
          .toArray()
      ).map((a) => a._id);

      AssortmentFilters.removeFilters({ _id: { $in: assortmentFilterIds } }, { skipInvalidation: true });

      log('Migration: Removed some disconnected assortment links/filters/products: ', {
        assortmentProductIds: assortmentProductIds.length,
        assortmentLinkIds: assortmentLinkIds.length,
        assortmentFilterIds: assortmentFilterIds.length,
      });

      Assortments.invalidateCache();
    },
  });
};
