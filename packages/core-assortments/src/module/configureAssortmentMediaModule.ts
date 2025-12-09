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

export const configureAssortmentMediaModule = async ({ db }: ModuleInput<Record<string, unknown>>) => {
  registerEvents(ASSORTMENT_MEDIA_EVENTS);

  const { AssortmentMedia, AssortmentMediaTexts } = await AssortmentMediaCollection(db);

  const upsertLocalizedText = async (
    assortmentMediaId: string,
    locale: Intl.Locale,
    text: Omit<Partial<AssortmentMediaText>, 'assortmentMediaId' | 'locale'>,
  ) => {
    const assortmentMediaText = (await AssortmentMediaTexts.findOneAndUpdate(
      {
        assortmentMediaId,
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
          created: new Date(),
          assortmentMediaId,
          locale: locale.baseName,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      },
    )) as AssortmentMediaText;
    await emit('ASSORTMENT_UPDATE_MEDIA_TEXT', {
      assortmentMediaId,
      text: assortmentMediaText,
    });
    return assortmentMediaText;
  };

  return {
    // Queries
    findAssortmentMedia: async ({ assortmentMediaId }: { assortmentMediaId: string }) => {
      return AssortmentMedia.findOne(generateDbFilterById(assortmentMediaId), {});
    },

    findAssortmentMedias: async (
      {
        assortmentId,
        tags,
        offset,
        limit,
      }: {
        assortmentId?: mongodb.Filter<AssortmentMediaType>['assortmentId'];
        limit?: number;
        offset?: number;
        tags?: string[];
      },
      options?: mongodb.FindOptions,
    ): Promise<AssortmentMediaType[]> => {
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

    create: async ({
      sortKey,
      tags = [],
      ...doc
    }: Omit<AssortmentMediaType, 'sortKey' | 'tags' | '_id' | 'created'> &
      Partial<Pick<AssortmentMediaType, 'sortKey' | 'tags' | '_id' | 'created'>>) => {
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
        tags,
        ...doc,
        sortKey,
      });

      const assortmentMedia = await AssortmentMedia.findOne(generateDbFilterById(assortmentMediaId), {});

      await emit('ASSORTMENT_ADD_MEDIA', {
        assortmentMedia,
      });

      return assortmentMedia;
    },

    delete: async (assortmentMediaId: string): Promise<number> => {
      const selector = generateDbFilterById(assortmentMediaId);
      await AssortmentMediaTexts.deleteMany({ assortmentMediaId });
      const deletedResult = await AssortmentMedia.deleteOne(selector);
      await emit('ASSORTMENT_REMOVE_MEDIA', {
        assortmentMediaId,
      });

      return deletedResult.deletedCount;
    },

    deleteMediaFiles: async ({
      assortmentId,
      excludedAssortmentIds,
      excludedAssortmentMediaIds,
    }: {
      assortmentId?: string;
      excludedAssortmentIds?: string[];
      excludedAssortmentMediaIds?: string[];
    }): Promise<number> => {
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
    update: async (assortmentMediaId: string, doc: Partial<AssortmentMediaType>) => {
      const selector = generateDbFilterById(assortmentMediaId);
      const modifier = { $set: doc };
      return AssortmentMedia.findOneAndUpdate(selector, modifier, {
        returnDocument: 'after',
      });
    },

    updateManualOrder: async ({
      sortKeys,
    }: {
      sortKeys: {
        assortmentMediaId: string;
        sortKey: number;
      }[];
    }): Promise<AssortmentMediaType[]> => {
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
      findMediaTexts: async (
        { assortmentMediaId }: mongodb.Filter<AssortmentMediaText>,
        options?: mongodb.FindOptions,
      ): Promise<AssortmentMediaText[]> => {
        return AssortmentMediaTexts.find({ assortmentMediaId }, options).toArray();
      },

      findLocalizedMediaText: async ({
        assortmentMediaId,
        locale,
      }: {
        assortmentMediaId: string;
        locale: Intl.Locale;
      }): Promise<AssortmentMediaText> => {
        const text = await findLocalizedText<AssortmentMediaText>(
          AssortmentMediaTexts,
          { assortmentMediaId },
          locale,
        );

        return text;
      },

      updateMediaTexts: async (
        assortmentMediaId: string,
        texts: ({ locale: AssortmentMediaText['locale'] } & Omit<
          Partial<AssortmentMediaText>,
          'assortmentMediaId' | 'locale'
        >)[],
      ) => {
        const mediaTexts = await Promise.all(
          texts.map(async ({ locale, ...text }) =>
            upsertLocalizedText(assortmentMediaId, new Intl.Locale(locale), text),
          ),
        );

        return mediaTexts;
      },
    },
  };
};

export type AssortmentMediaModule = Awaited<ReturnType<typeof configureAssortmentMediaModule>>;
