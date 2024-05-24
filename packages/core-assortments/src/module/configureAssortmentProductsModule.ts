import { AssortmentProduct, AssortmentsModule } from '@unchainedshop/types/assortments.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbObjectId, mongodb } from '@unchainedshop/mongodb';

const ASSORTMENT_PRODUCT_EVENTS = [
  'ASSORTMENT_ADD_PRODUCT',
  'ASSORTMENT_REMOVE_PRODUCT',
  'ASSORTMENT_REORDER_PRODUCTS',
];

export const configureAssortmentProductsModule = ({
  AssortmentProducts,
  invalidateCache,
}: {
  AssortmentProducts: mongodb.Collection<AssortmentProduct>;
  invalidateCache: AssortmentsModule['invalidateCache'];
}): AssortmentsModule['products'] => {
  registerEvents(ASSORTMENT_PRODUCT_EVENTS);

  return {
    // Queries
    findAssortmentIds: async ({ productId, tags }) => {
      const selector: mongodb.Filter<AssortmentProduct> = { productId };
      if (tags) {
        selector.tags = { $in: tags };
      }
      return AssortmentProducts.find(selector, { projection: { assortmentId: true } })
        .map(({ assortmentId }) => assortmentId)
        .toArray();
    },

    findProductIds: async ({ assortmentId, tags }) => {
      const selector: mongodb.Filter<AssortmentProduct> = { assortmentId };
      if (tags) {
        selector.tags = { $in: tags };
      }
      return AssortmentProducts.find(selector, { projection: { productId: true } })
        .map(({ productId }) => productId)
        .toArray();
    },

    findProduct: async ({ assortmentProductId }) => {
      return AssortmentProducts.findOne(generateDbFilterById(assortmentProductId), {});
    },

    findProducts: async ({ assortmentId, assortmentIds }, options) => {
      const products = AssortmentProducts.find(
        { assortmentId: assortmentId || { $in: assortmentIds } },
        options,
      );
      return products.toArray();
    },

    findProductSiblings: async ({ assortmentIds, productId }) => {
      const selector = {
        assortmentId: { $in: assortmentIds },
      };

      const assortmentProducts = await AssortmentProducts.find(selector, {
        sort: { sortKey: 1 },
        projection: { productId: 1 },
      }).toArray();

      return assortmentProducts
        .filter((product) => product.productId !== productId)
        .map((product) => product.productId);
    },

    // Mutations
    create: async (doc: AssortmentProduct, options) => {
      const { _id, assortmentId, productId, sortKey, ...rest } = doc;

      const selector = {
        ...(doc._id ? generateDbFilterById(doc._id) : {}),
        productId,
        assortmentId,
      };
      const $set: any = {
        updated: new Date(),
        ...rest,
      };
      const $setOnInsert: any = {
        _id: _id || generateDbObjectId(),
        productId,
        assortmentId,
        created: new Date(),
      };

      if (sortKey === undefined || sortKey === null) {
        // Get next sort key
        const lastAssortmentProduct = (await AssortmentProducts.findOne(
          { assortmentId },
          { sort: { sortKey: -1 } },
        )) || { sortKey: 0 };
        $setOnInsert.sortKey = lastAssortmentProduct.sortKey + 1;
      } else {
        $set.sortKey = sortKey;
      }

      const assortmentProduct = await AssortmentProducts.findOneAndUpdate(
        selector,
        {
          $set,
          $setOnInsert,
        },
        { upsert: true, returnDocument: 'after' },
      );

      await emit('ASSORTMENT_ADD_PRODUCT', { assortmentProduct });

      if (!options?.skipInvalidation) {
        await invalidateCache({ assortmentIds: [assortmentProduct.assortmentId] });
      }

      return assortmentProduct;
    },

    delete: async (assortmentProductId, options) => {
      const selector = generateDbFilterById(assortmentProductId);

      const assortmentProduct = await AssortmentProducts.findOne(selector, {
        projection: { _id: 1, assortmentId: 1 },
      });

      if (!assortmentProduct) return [];

      await AssortmentProducts.deleteOne(selector);

      await emit('ASSORTMENT_REMOVE_PRODUCT', {
        assortmentProductId: assortmentProduct._id,
      });

      if (!options?.skipInvalidation) {
        await invalidateCache({ assortmentIds: [assortmentProduct.assortmentId] });
      }

      return [assortmentProduct];
    },

    deleteMany: async (selector, options) => {
      const assortmentProducts = await AssortmentProducts.find(selector, {
        projection: { _id: 1, assortmentId: 1 },
      }).toArray();

      const deletionResult = await AssortmentProducts.deleteMany(selector);
      await Promise.all(
        assortmentProducts.map(async (assortmentProduct) =>
          emit('ASSORTMENT_REMOVE_PRODUCT', {
            assortmentProductId: assortmentProduct._id,
          }),
        ),
      );

      if (!options?.skipInvalidation && assortmentProducts.length) {
        await invalidateCache({
          assortmentIds: assortmentProducts.map((product) => product.assortmentId),
        });
      }

      return deletionResult.deletedCount;
    },

    // This action is specifically used for the bulk migration scripts in the platform package
    update: async (assortmentProductId, doc, options) => {
      const selector = generateDbFilterById(assortmentProductId);
      const modifier = {
        $set: {
          ...doc,
          updated: new Date(),
        },
      };
      const assortmentProduct = await AssortmentProducts.findOneAndUpdate(selector, modifier, {
        returnDocument: 'after',
      });

      if (!options?.skipInvalidation) {
        await invalidateCache({ assortmentIds: [assortmentProduct.assortmentId] });
      }
      return assortmentProduct;
    },

    updateManualOrder: async ({ sortKeys }, options) => {
      const changedAssortmentProductIds = await Promise.all(
        sortKeys.map(async ({ assortmentProductId, sortKey }) => {
          await AssortmentProducts.updateOne(generateDbFilterById(assortmentProductId), {
            $set: {
              sortKey: sortKey + 1,
              updated: new Date(),
            },
          });
          return assortmentProductId;
        }),
      );

      const assortmentProducts = await AssortmentProducts.find({
        _id: { $in: changedAssortmentProductIds },
      }).toArray();

      if (!options?.skipInvalidation && assortmentProducts.length) {
        await invalidateCache({
          assortmentIds: assortmentProducts.map((product) => product.assortmentId),
        });
      }

      await emit('ASSORTMENT_REORDER_PRODUCTS', { assortmentProducts });

      return assortmentProducts;
    },
  };
};
