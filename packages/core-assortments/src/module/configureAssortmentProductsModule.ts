import {
  AssortmentProduct,
  AssortmentsModule,
} from '@unchainedshop/types/assortments';
import { Collection } from '@unchainedshop/types/common';
import { emit, registerEvents } from 'meteor/unchained:director-events';
import {
  dbIdToString,
  generateDbFilterById,
  generateId,
} from 'meteor/unchained:utils';

const ASSORTMENT_PRODUCT_EVENTS = [
  'ASSORTMENT_ADD_PRODUCT',
  'ASSORTMENT_REMOVE_PRODUCT',
  'ASSORTMENT_REORDER_PRODUCTS',
];

export const configureAssortmentProductsModule = ({
  AssortmentProducts,
  invalidateCache,
}: {
  AssortmentProducts: Collection<AssortmentProduct>;
  invalidateCache: AssortmentsModule['invalidateCache'];
}): AssortmentsModule['products'] => {
  registerEvents(ASSORTMENT_PRODUCT_EVENTS);

  return {
    // Queries
    findAssortmentIds: async ({ productId }) => {
      return await AssortmentProducts.find(
        { productId },
        { projection: { assortmentId: true } }
      )
        .map(({ assortmentId }) => assortmentId)
        .toArray();
    },

    findProduct: async ({ assortmentProductId }) => {
      return await AssortmentProducts.findOne(
        generateDbFilterById(assortmentProductId)
      );
    },

    findProducts: async ({ assortmentId }) => {
      const products = AssortmentProducts.find({ assortmentId });
      return await products.toArray();
    },

    findProductSiblings: async ({ assortmentIds, productId }) => {
      const selector = {
        $and: [
          {
            productId: { $ne: productId },
          },
          {
            assortmentId: { $in: assortmentIds },
          },
        ],
      };

      return await AssortmentProducts.find(selector, {
        projection: { productId: 1 },
      })
        .map(({ productId }) => productId)
        .toArray();
    },

    // Mutations
    create: async (doc: AssortmentProduct, options, userId) => {
      const { assortmentId, productId, ...rest } = doc;

      const selector = {
        ...(doc._id ? generateDbFilterById(doc._id) : {}),
        productId,
        assortmentId,
      };

      const $set: any = {
        updated: new Date(),
        updatedBy: userId,
        ...rest,
      };
      const $setOnInsert: any = {
        productId,
        assortmentId,
        created: new Date(),
        createdBy: userId,
      };

      if (!doc.sortKey) {
        // Get next sort key
        const lastAssortmentProduct = (await AssortmentProducts.findOne(
          { assortmentId },
          { sort: { sortKey: -1 } }
        )) || { sortKey: 0 };
        $setOnInsert.sortKey = lastAssortmentProduct.sortKey + 1;
      } else {
        $set.sortKey = doc.sortKey;
      }

      await AssortmentProducts.updateOne(selector, {
        $set,
        $setOnInsert,
      });

      const assortmentProduct = await AssortmentProducts.findOne(selector);

      emit('ASSORTMENT_ADD_PRODUCT', { assortmentProduct });

      if (!options.skipInvalidation) {
        invalidateCache({ assortmentIds: [assortmentId] });
      }

      return dbIdToString(assortmentProduct._id);
    },

    delete: async (assortmentProductId, options) => {
      const selector = generateDbFilterById(assortmentProductId);

      const assortmentProduct = await AssortmentProducts.findOne(selector, {
        projection: { _id: 1, assortmentId: 1 },
      });

      AssortmentProducts.deleteOne(selector);

      emit('ASSORTMENT_REMOVE_PRODUCT', {
        assortmentProductId: assortmentProduct._id,
      });

      if (!options.skipInvalidation) {
        invalidateCache({
          assortmentIds: [assortmentProduct.assortmentId],
        });
      }

      return [assortmentProduct];
    },

    deleteMany: async (selector, options) => {
      const assortmentProducts = await AssortmentProducts.find(selector, {
        projection: { _id: 1, assortmentId: 1 },
      }).toArray();

      AssortmentProducts.deleteMany(selector);
      assortmentProducts.forEach((assortmentProduct) => {
        emit('ASSORTMENT_REMOVE_PRODUCT', {
          assortmentProductId: assortmentProduct._id,
        });
      });

      if (!options.skipInvalidation && assortmentProducts.length) {
        invalidateCache({
          assortmentIds: assortmentProducts.map(
            (product) => product.assortmentId
          ),
        });
      }

      return assortmentProducts;
    },

    updateManualOrder: async ({ sortKeys }, userId) => {
      const changedAssortmentProductIds = await Promise.all(
        sortKeys.map(async ({ assortmentProductId, sortKey }) => {
          await AssortmentProducts.updateOne(
            generateDbFilterById(assortmentProductId),
            {
              $set: {
                sortKey: sortKey + 1,
                updated: new Date(),
                updatedBy: userId,
              },
            }
          );

          return generateId(assortmentProductId);
        })
      );

      const assortmentProducts = await AssortmentProducts.find({
        _id: { $in: changedAssortmentProductIds },
      }).toArray();

      emit('ASSORTMENT_REORDER_PRODUCTS', { assortmentProducts });

      return assortmentProducts;
    },
  };
};