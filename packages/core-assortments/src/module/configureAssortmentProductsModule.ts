import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbObjectId, mongodb } from '@unchainedshop/mongodb';
import { InvalidateCacheFn, AssortmentProduct } from '../db/AssortmentsCollection.js';

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
  invalidateCache: InvalidateCacheFn;
}) => {
  registerEvents(ASSORTMENT_PRODUCT_EVENTS);

  return {
    // Queries
    findAssortmentIds: async ({
      productId,
      tags,
    }: {
      productId: string;
      tags?: string[];
    }): Promise<string[]> => {
      const selector: mongodb.Filter<AssortmentProduct> = { productId };
      if (tags) {
        selector.tags = { $in: tags };
      }
      return AssortmentProducts.find(selector, { projection: { assortmentId: true } })
        .map(({ assortmentId }) => assortmentId)
        .toArray();
    },

    findProductIds: async ({
      assortmentId,
      tags,
    }: {
      assortmentId: string;
      tags?: string[];
    }): Promise<string[]> => {
      const selector: mongodb.Filter<AssortmentProduct> = { assortmentId };
      if (tags) {
        selector.tags = { $in: tags };
      }
      return AssortmentProducts.find(selector, { projection: { productId: true } })
        .map(({ productId }) => productId)
        .toArray();
    },

    findAssortmentProduct: async ({ assortmentProductId }: { assortmentProductId: string }) => {
      return AssortmentProducts.findOne(generateDbFilterById(assortmentProductId), {});
    },

    findAssortmentProducts: async (
      {
        productId,
        productIds,
        assortmentId,
        assortmentIds,
      }: {
        assortmentId?: string;
        assortmentIds?: string[];
        productId?: string;
        productIds?: string[];
      },
      options?: mongodb.FindOptions,
    ): Promise<AssortmentProduct[]> => {
      const selector: mongodb.Filter<AssortmentProduct> = {};
      if (assortmentId || assortmentIds) {
        selector.assortmentId = assortmentId || { $in: assortmentIds };
      }
      if (productId || productIds) {
        selector.productId = productId || { $in: productIds };
      }
      const assortmentProducts = AssortmentProducts.find(selector, options);
      return assortmentProducts.toArray();
    },

    findSiblings: async ({
      assortmentIds,
      productId,
    }: {
      productId: string;
      assortmentIds: string[];
    }): Promise<string[]> => {
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
    create: async (doc: AssortmentProduct, options?: { skipInvalidation?: boolean }) => {
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

      if (!assortmentProduct) return null;

      await emit('ASSORTMENT_ADD_PRODUCT', { assortmentProduct });

      if (!options?.skipInvalidation) {
        await invalidateCache({ assortmentIds: [assortmentProduct.assortmentId] });
      }

      return assortmentProduct;
    },

    delete: async (
      assortmentProductId: string,
      options?: { skipInvalidation?: boolean },
    ): Promise<AssortmentProduct[]> => {
      const selector = generateDbFilterById(assortmentProductId);

      const assortmentProduct = await AssortmentProducts.findOneAndDelete(selector);
      if (!assortmentProduct) return [];

      await emit('ASSORTMENT_REMOVE_PRODUCT', {
        assortmentProductId: assortmentProduct._id,
      });

      if (!options?.skipInvalidation) {
        await invalidateCache({ assortmentIds: [assortmentProduct.assortmentId] });
      }

      return [assortmentProduct];
    },

    deleteMany: async (
      selector: mongodb.Filter<AssortmentProduct>,
      options?: { skipInvalidation?: boolean },
    ): Promise<number> => {
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
    update: async (
      assortmentProductId: string,
      doc: AssortmentProduct,
      options?: { skipInvalidation?: boolean },
    ) => {
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

      if (!options?.skipInvalidation && assortmentProduct) {
        await invalidateCache({ assortmentIds: [assortmentProduct.assortmentId] });
      }
      return assortmentProduct;
    },

    updateManualOrder: async (
      {
        sortKeys,
      }: {
        sortKeys: {
          assortmentProductId: string;
          sortKey: number;
        }[];
      },
      options?: { skipInvalidation?: boolean },
    ): Promise<AssortmentProduct[]> => {
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

export type AssortmentProductsModule = ReturnType<typeof configureAssortmentProductsModule>;
