import { ModuleInput } from '@unchainedshop/mongodb';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  findLocalizedText,
  generateDbFilterById,
  generateDbObjectId,
  mongodb,
} from '@unchainedshop/mongodb';
import { ProductMedia, ProductMediaCollection, ProductMediaText } from '../db/ProductMediaCollection.js';

const PRODUCT_MEDIA_EVENTS = [
  'PRODUCT_ADD_MEDIA',
  'PRODUCT_REMOVE_MEDIA',
  'PRODUCT_REORDER_MEDIA',
  'PRODUCT_UPDATE_MEDIA_TEXT',
];

export const configureProductMediaModule = async ({ db }: ModuleInput<Record<string, never>>) => {
  registerEvents(PRODUCT_MEDIA_EVENTS);

  const { ProductMedias, ProductMediaTexts } = await ProductMediaCollection(db);

  const upsertLocalizedText = async (
    productMediaId: string,
    locale: Intl.Locale,
    text: Omit<ProductMediaText, 'productMediaId' | 'locale' | 'created' | 'updated' | 'deleted'>,
  ): Promise<ProductMediaText> => {
    const updateResult = await ProductMediaTexts.findOneAndUpdate(
      {
        productMediaId,
        locale: locale.baseName,
      },
      {
        $set: {
          updated: new Date(),
          title: text.title,
          subtitle: text.subtitle,
        },
        $setOnInsert: {
          _id: generateDbObjectId(),
          productMediaId,
          created: new Date(),
          locale: locale.baseName,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
        includeResultMetadata: true,
      },
    );
    if (updateResult.ok) {
      await emit('PRODUCT_UPDATE_MEDIA_TEXT', {
        productMediaId,
        text: updateResult.value,
      });
    }
    return updateResult.value;
  };

  return {
    // Queries
    findProductMedia: async ({ productMediaId }: { productMediaId: string }): Promise<ProductMedia> => {
      return ProductMedias.findOne(generateDbFilterById(productMediaId), {});
    },

    findProductMedias: async (
      {
        productId,
        tags,
        offset,
        limit,
      }: {
        productId?: mongodb.Filter<ProductMedia>['assortmentId'];
        limit?: number;
        offset?: number;
        tags?: string[];
      },
      options?: mongodb.FindOptions<ProductMedia>,
    ): Promise<ProductMedia[]> => {
      const selector: mongodb.Filter<ProductMedia> = productId ? { productId } : {};
      if (tags?.length > 0) {
        selector.tags = { $all: tags };
      }

      const mediaList = ProductMedias.find(selector, {
        skip: offset,
        limit,
        sort: { sortKey: 1 },
        ...options,
      });

      return mediaList.toArray();
    },

    // Mutations
    create: async ({
      sortKey,
      ...doc
    }: Omit<ProductMedia, 'sortKey' | 'tags' | '_id' | 'created'> &
      Partial<Pick<ProductMedia, 'sortKey' | 'tags' | '_id'>>): Promise<ProductMedia> => {
      if (sortKey === undefined || sortKey === null) {
        // Get next sort key
        const lastProductMedia = (await ProductMedias.findOne(
          {
            productId: doc.productId,
          },
          {
            sort: { sortKey: -1 },
          },
        )) || { sortKey: 0 };
        sortKey = lastProductMedia.sortKey + 1;
      }

      const { insertedId: productMediaId } = await ProductMedias.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        tags: [],
        ...doc,
        sortKey,
      });

      const productMedia = await ProductMedias.findOne(generateDbFilterById(productMediaId), {});

      await emit('PRODUCT_ADD_MEDIA', {
        productMedia,
      });

      return productMedia;
    },

    delete: async (productMediaId: string) => {
      const selector = generateDbFilterById(productMediaId);

      await ProductMediaTexts.deleteMany({ productMediaId });

      const deletedResult = await ProductMedias.deleteOne(selector);

      await emit('PRODUCT_REMOVE_MEDIA', {
        productMediaId,
      });

      return deletedResult.deletedCount;
    },

    deleteMediaFiles: async ({
      productId,
      excludedProductIds,
      excludedProductMediaIds,
    }: {
      productId?: string;
      excludedProductIds?: string[];
      excludedProductMediaIds?: string[];
    }): Promise<number> => {
      const selector: mongodb.Filter<ProductMedia> = productId ? { productId } : {};

      if (!productId && excludedProductIds) {
        selector.productId = { $nin: excludedProductIds };
      }

      if (excludedProductMediaIds) {
        selector._id = { $nin: excludedProductMediaIds };
      }

      const ids = await ProductMedias.distinct('_id', selector);

      await ProductMediaTexts.deleteMany({ productMediaId: { $in: ids } });

      const deletedResult = await ProductMedias.deleteMany(selector);

      await Promise.all(
        ids.map(async (assortmentMediaId) =>
          emit('PRODUCT_REMOVE_MEDIA', {
            assortmentMediaId,
          }),
        ),
      );

      return deletedResult.deletedCount;
    },

    // This action is specifically used for the bulk migration scripts in the platform package
    update: async (productMediaId: string, doc: Partial<ProductMedia>): Promise<ProductMedia> => {
      const selector = generateDbFilterById(productMediaId);
      const modifier = { $set: doc };
      return ProductMedias.findOneAndUpdate(selector, modifier, { returnDocument: 'after' });
    },

    updateManualOrder: async ({
      sortKeys,
    }: {
      sortKeys: {
        productMediaId: string;
        sortKey: number;
      }[];
    }): Promise<ProductMedia[]> => {
      const changedProductMediaIds = await Promise.all(
        sortKeys.map(async ({ productMediaId, sortKey }) => {
          await ProductMedias.updateOne(generateDbFilterById(productMediaId), {
            $set: {
              sortKey: sortKey + 1,
              updated: new Date(),
            },
          });

          return productMediaId;
        }),
      );

      const productMedias = await ProductMedias.find(
        {
          _id: { $in: changedProductMediaIds },
        },
        { sort: { sortKey: 1 } },
      ).toArray();

      await emit('PRODUCT_REORDER_MEDIA', { productMedias });

      return productMedias;
    },

    /*
     * Product Media Texts
     */

    texts: {
      // Queries
      findMediaTexts: async (
        { productMediaId }: mongodb.Filter<ProductMediaText>,
        options?: mongodb.FindOptions,
      ): Promise<ProductMediaText[]> => {
        return ProductMediaTexts.find({ productMediaId }, options).toArray();
      },

      findLocalizedMediaText: async ({
        productMediaId,
        locale,
      }: {
        productMediaId: string;
        locale: Intl.Locale;
      }): Promise<ProductMediaText> => {
        const text = await findLocalizedText<ProductMediaText>(
          ProductMediaTexts,
          { productMediaId },
          locale,
        );

        return text;
      },

      // Mutations
      updateMediaTexts: async (
        productMediaId: string,
        texts: Omit<ProductMediaText, 'productMediaId' | 'created' | 'updated' | 'deleted'>[],
      ): Promise<ProductMediaText[]> => {
        const mediaTexts = (
          await Promise.all(
            texts.map(async ({ locale, ...localizations }) =>
              upsertLocalizedText(productMediaId, new Intl.Locale(locale), localizations),
            ),
          )
        ).filter(Boolean) as ProductMediaText[];

        return mediaTexts;
      },
    },
  };
};
