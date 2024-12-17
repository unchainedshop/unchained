import { emit, registerEvents } from '@unchainedshop/events';
import {
  findLocalizedText,
  generateDbFilterById,
  generateDbObjectId,
  mongodb,
  ModuleInput,
} from '@unchainedshop/mongodb';
import { AssortmentMediaCollection } from '../db/AssortmentMediaCollection.js';
import { AssortmentMediaText, AssortmentMediaType } from '../db/AssortmentMediaCollection.js';

const ASSORTMENT_MEDIA_EVENTS = [
  'ASSORTMENT_ADD_MEDIA',
  'ASSORTMENT_REMOVE_MEDIA',
  'ASSORTMENT_REORDER_MEDIA',
  'ASSORTMENT_UPDATE_MEDIA_TEXT',
];

export type AssortmentMediaModule = {
  // Queries
  findAssortmentMedia: (params: { assortmentMediaId: string }) => Promise<AssortmentMediaType>;

  findAssortmentMedias: (
    params: {
      assortmentId?: mongodb.Filter<AssortmentMediaType>['assortmentId'];
      limit?: number;
      offset?: number;
      tags?: Array<string>;
    },
    options?: mongodb.FindOptions,
  ) => Promise<Array<AssortmentMediaType>>;

  create: (doc: { assortmentId: string; mediaId: string }) => Promise<AssortmentMediaType>;

  delete: (assortmentMediaId: string) => Promise<number>;

  deleteMediaFiles: (params: {
    assortmentId?: string;
    excludedAssortmentIds?: Array<string>;
    excludedAssortmentMediaIds?: Array<string>;
  }) => Promise<number>;

  update: (assortmentMediaId: string, doc: AssortmentMediaType) => Promise<AssortmentMediaType>;

  updateManualOrder: (params: {
    sortKeys: Array<{
      assortmentMediaId: string;
      sortKey: number;
    }>;
  }) => Promise<Array<AssortmentMediaType>>;

  texts: {
    findMediaTexts: (
      query: mongodb.Filter<AssortmentMediaText>,
      options?: mongodb.FindOptions,
    ) => Promise<Array<AssortmentMediaText>>;

    findLocalizedMediaText: (query: {
      assortmentMediaId: string;
      locale: string;
    }) => Promise<AssortmentMediaText>;

    updateMediaTexts: (
      assortmentMediaId: string,
      texts: Array<Omit<AssortmentMediaText, 'assortmentMediaId'>>,
    ) => Promise<Array<AssortmentMediaText>>;
  };
};

export const configureAssortmentMediaModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<AssortmentMediaModule> => {
  registerEvents(ASSORTMENT_MEDIA_EVENTS);

  const { AssortmentMedia, AssortmentMediaTexts } = await AssortmentMediaCollection(db);

  const upsertLocalizedText = async (
    assortmentMediaId: string,
    locale: string,
    text: Omit<AssortmentMediaText, 'assortmentMediaId' | 'locale'>,
  ): Promise<AssortmentMediaText> => {
    const selector = {
      assortmentMediaId,
      locale,
    };
    const currentText = await AssortmentMediaTexts.findOneAndUpdate(
      selector,
      {
        $set: {
          updated: new Date(),
          ...text,
        },
        $setOnInsert: {
          _id: generateDbObjectId(),
          created: new Date(),
          assortmentMediaId,
          locale,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
        includeResultMetadata: true,
      },
    );
    if (currentText.ok) {
      await emit('ASSORTMENT_UPDATE_MEDIA_TEXT', {
        assortmentMediaId,
        text: currentText.value,
      });
    }
    return currentText.value;
  };

  return {
    // Queries
    findAssortmentMedia: async ({ assortmentMediaId }) => {
      return AssortmentMedia.findOne(generateDbFilterById(assortmentMediaId), {});
    },

    findAssortmentMedias: async ({ assortmentId, tags, offset, limit }, options) => {
      const selector: mongodb.Filter<AssortmentMediaType> = assortmentId ? { assortmentId } : {};
      if (tags && tags.length > 0) {
        selector.tags = { $all: tags };
      }

      const mediaList = AssortmentMedia.find(selector, {
        skip: offset,
        limit,
        sort: { sortKey: 1 },
        ...options,
      });

      return mediaList.toArray();
    },

    create: async (doc: AssortmentMediaType) => {
      let { sortKey } = doc;

      if (sortKey === undefined || sortKey === null) {
        // Get next sort key
        const lastAssortmentMedia = (await AssortmentMedia.findOne(
          {
            assortmentId: doc.assortmentId,
          },
          {
            sort: { sortKey: -1 },
          },
        )) || { sortKey: 0 };
        sortKey = lastAssortmentMedia.sortKey + 1;
      }

      const { insertedId: assortmentMediaId } = await AssortmentMedia.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        tags: [],
        ...doc,
        sortKey,
      });

      const assortmentMedia = await AssortmentMedia.findOne(generateDbFilterById(assortmentMediaId), {});

      await emit('ASSORTMENT_ADD_MEDIA', {
        assortmentMedia,
      });

      return assortmentMedia;
    },

    delete: async (assortmentMediaId) => {
      const selector = generateDbFilterById(assortmentMediaId);
      await AssortmentMediaTexts.deleteMany({ assortmentMediaId });
      const deletedResult = await AssortmentMedia.deleteOne(selector);
      await emit('ASSORTMENT_REMOVE_MEDIA', {
        assortmentMediaId,
      });

      return deletedResult.deletedCount;
    },

    deleteMediaFiles: async ({ assortmentId, excludedAssortmentIds, excludedAssortmentMediaIds }) => {
      const selector: mongodb.Filter<AssortmentMediaType> = assortmentId ? { assortmentId } : {};

      if (!assortmentId && excludedAssortmentIds) {
        selector.assortmentId = { $nin: excludedAssortmentIds };
      }

      if (excludedAssortmentMediaIds) {
        selector._id = { $nin: excludedAssortmentMediaIds };
      }

      const ids = await AssortmentMedia.find(selector, { projection: { _id: true } })
        .map((m) => m._id)
        .toArray();

      await AssortmentMediaTexts.deleteMany({ assortmentMediaId: { $in: ids } });

      const deletedResult = await AssortmentMedia.deleteMany(selector);

      await Promise.all(
        ids.map(async (assortmentMediaId) =>
          emit('ASSORTMENT_REMOVE_MEDIA', {
            assortmentMediaId,
          }),
        ),
      );

      return deletedResult.deletedCount;
    },

    // This action is specifically used for the bulk migration scripts in the platform package
    update: async (assortmentMediaId, doc) => {
      const selector = generateDbFilterById(assortmentMediaId);
      const modifier = { $set: doc };
      return AssortmentMedia.findOneAndUpdate(selector, modifier, {
        returnDocument: 'after',
      });
    },

    updateManualOrder: async ({ sortKeys }) => {
      const changedAssortmentMediaIds = await Promise.all(
        sortKeys.map(async ({ assortmentMediaId, sortKey }) => {
          await AssortmentMedia.updateOne(generateDbFilterById(assortmentMediaId), {
            $set: {
              sortKey: sortKey + 1,
              updated: new Date(),
            },
          });

          return assortmentMediaId;
        }),
      );

      const assortmentMedias = await AssortmentMedia.find({
        _id: { $in: changedAssortmentMediaIds },
      }).toArray();

      await emit('ASSORTMENT_REORDER_MEDIA', { assortmentMedias });

      return assortmentMedias;
    },

    /*
     * Assortment Media Texts
     */

    texts: {
      // Queries
      findMediaTexts: async ({ assortmentMediaId }, options) => {
        return AssortmentMediaTexts.find({ assortmentMediaId }, options).toArray();
      },

      findLocalizedMediaText: async ({ assortmentMediaId, locale }) => {
        const parsedLocale = new Intl.Locale(locale);

        const text = await findLocalizedText<AssortmentMediaText>(
          AssortmentMediaTexts,
          { assortmentMediaId },
          parsedLocale,
        );

        return text;
      },

      updateMediaTexts: async (assortmentMediaId, texts) => {
        const mediaTexts = await Promise.all(
          texts.map(async ({ locale, ...text }) => upsertLocalizedText(assortmentMediaId, locale, text)),
        );

        return mediaTexts;
      },
    },
  };
};
