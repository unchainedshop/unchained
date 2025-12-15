import { emit, registerEvents } from '@unchainedshop/events';
import { type Database, generateId, toSqliteDate, type FindOptions } from '@unchainedshop/sqlite';
import {
  type AssortmentMediaType,
  type AssortmentMediaText,
  ASSORTMENT_MEDIA_TABLE,
  ASSORTMENT_MEDIA_TEXTS_TABLE,
} from '../db/AssortmentsCollection.ts';

const ASSORTMENT_MEDIA_EVENTS = [
  'ASSORTMENT_ADD_MEDIA',
  'ASSORTMENT_REMOVE_MEDIA',
  'ASSORTMENT_REORDER_MEDIA',
  'ASSORTMENT_UPDATE_MEDIA_TEXT',
];

export const configureAssortmentMediaModule = async ({ db }: { db: Database }) => {
  registerEvents(ASSORTMENT_MEDIA_EVENTS);

  const upsertLocalizedText = async (
    assortmentMediaId: string,
    locale: Intl.Locale,
    text: Omit<Partial<AssortmentMediaText>, 'assortmentMediaId' | 'locale'>,
  ) => {
    const localeStr = locale.baseName;
    const now = new Date();

    // Check if exists
    const existing = db.findOne<AssortmentMediaText>(ASSORTMENT_MEDIA_TEXTS_TABLE, {
      where: { assortmentMediaId, locale: localeStr },
    });

    let assortmentMediaText: AssortmentMediaText;

    if (existing) {
      // Update existing
      assortmentMediaText = db.update<AssortmentMediaText>(ASSORTMENT_MEDIA_TEXTS_TABLE, existing._id, {
        ...text,
        updated: now,
      })!;
    } else {
      // Insert new
      assortmentMediaText = db.insert<AssortmentMediaText>(ASSORTMENT_MEDIA_TEXTS_TABLE, {
        _id: generateId(),
        assortmentMediaId,
        locale: localeStr,
        title: text.title,
        subtitle: text.subtitle,
        created: now,
      } as AssortmentMediaText);
    }

    await emit('ASSORTMENT_UPDATE_MEDIA_TEXT', {
      assortmentMediaId,
      text: assortmentMediaText,
    });

    return assortmentMediaText;
  };

  return {
    // Queries
    findAssortmentMedia: async ({ assortmentMediaId }: { assortmentMediaId: string }) => {
      return db.findById<AssortmentMediaType>(ASSORTMENT_MEDIA_TABLE, assortmentMediaId);
    },

    findAssortmentMedias: async (
      selector: {
        assortmentId?: string;
        assortmentIds?: string[];
        tags?: string[];
      },
      options?: FindOptions,
    ): Promise<AssortmentMediaType[]> => {
      const { assortmentId, assortmentIds, tags } = selector;
      const where: Record<string, any> = {};

      if (assortmentIds && assortmentIds.length > 0) {
        where.assortmentId = { $in: assortmentIds };
      } else if (assortmentId) {
        where.assortmentId = assortmentId;
      }

      if (tags && tags.length > 0) {
        // Check if all tags are present in the JSON array using $jsonContainsAll
        where.tags = { $jsonContainsAll: tags };
      }

      // Default sort by sortKey if not specified
      const effectiveOptions = options ? { ...options } : {};
      if (!effectiveOptions.sort) {
        effectiveOptions.sort = { sortKey: 1 };
      }

      return db.find<AssortmentMediaType>(ASSORTMENT_MEDIA_TABLE, {
        where,
        ...effectiveOptions,
      });
    },

    create: async ({
      sortKey,
      tags = [],
      ...doc
    }: Omit<AssortmentMediaType, 'sortKey' | 'tags' | '_id' | 'created'> &
      Partial<Pick<AssortmentMediaType, 'sortKey' | 'tags' | '_id' | 'created'>>) => {
      const now = new Date();

      // Get next sort key if not provided
      let finalSortKey = sortKey;
      if (finalSortKey === undefined || finalSortKey === null) {
        const last = db.findOne<AssortmentMediaType>(ASSORTMENT_MEDIA_TABLE, {
          where: { assortmentId: doc.assortmentId },
          sort: { sortKey: -1 },
          limit: 1,
        });
        finalSortKey = (last?.sortKey || 0) + 1;
      }

      const assortmentMedia = db.insert<AssortmentMediaType>(ASSORTMENT_MEDIA_TABLE, {
        _id: generateId(),
        assortmentId: doc.assortmentId,
        mediaId: doc.mediaId,
        sortKey: finalSortKey,
        tags,
        meta: doc.meta,
        created: now,
      } as AssortmentMediaType);

      await emit('ASSORTMENT_ADD_MEDIA', {
        assortmentMedia,
      });

      return assortmentMedia;
    },

    delete: async (assortmentMediaId: string): Promise<number> => {
      db.run(`DELETE FROM ${ASSORTMENT_MEDIA_TEXTS_TABLE} WHERE assortment_media_id = ?`, [
        assortmentMediaId,
      ]);
      const { changes } = db.run(`DELETE FROM ${ASSORTMENT_MEDIA_TABLE} WHERE _id = ?`, [
        assortmentMediaId,
      ]);

      await emit('ASSORTMENT_REMOVE_MEDIA', {
        assortmentMediaId,
      });

      return changes;
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
      const conditions: string[] = [];
      const params: any[] = [];

      if (assortmentId) {
        conditions.push('assortment_id = ?');
        params.push(assortmentId);
      } else if (excludedAssortmentIds && excludedAssortmentIds.length > 0) {
        const placeholders = excludedAssortmentIds.map(() => '?').join(', ');
        conditions.push(`assortment_id NOT IN (${placeholders})`);
        params.push(...excludedAssortmentIds);
      }

      if (excludedAssortmentMediaIds && excludedAssortmentMediaIds.length > 0) {
        const placeholders = excludedAssortmentMediaIds.map(() => '?').join(', ');
        conditions.push(`_id NOT IN (${placeholders})`);
        params.push(...excludedAssortmentMediaIds);
      }

      // Get IDs for events and text deletion
      let selectSql = `SELECT _id FROM ${ASSORTMENT_MEDIA_TABLE}`;
      if (conditions.length > 0) {
        selectSql += ` WHERE ${conditions.join(' AND ')}`;
      }
      const ids = db.queryColumn<string>(selectSql, params);

      if (ids.length === 0) return 0;

      // Delete texts
      const textPlaceholders = ids.map(() => '?').join(', ');
      db.run(
        `DELETE FROM ${ASSORTMENT_MEDIA_TEXTS_TABLE} WHERE assortment_media_id IN (${textPlaceholders})`,
        ids,
      );

      // Delete media
      let deleteSql = `DELETE FROM ${ASSORTMENT_MEDIA_TABLE}`;
      if (conditions.length > 0) {
        deleteSql += ` WHERE ${conditions.join(' AND ')}`;
      }
      const { changes } = db.run(deleteSql, params);

      await Promise.all(
        ids.map(async (id) =>
          emit('ASSORTMENT_REMOVE_MEDIA', {
            assortmentMediaId: id,
          }),
        ),
      );

      return changes;
    },

    // This action is specifically used for the bulk migration scripts in the platform package
    update: async (assortmentMediaId: string, doc: Partial<AssortmentMediaType>) => {
      const updates = { ...doc, updated: new Date() };
      return db.update<AssortmentMediaType>(ASSORTMENT_MEDIA_TABLE, assortmentMediaId, updates);
    },

    updateManualOrder: async ({
      sortKeys,
    }: {
      sortKeys: {
        assortmentMediaId: string;
        sortKey: number;
      }[];
    }): Promise<AssortmentMediaType[]> => {
      const now = toSqliteDate(new Date());
      const changedAssortmentMediaIds: string[] = [];

      for (const { assortmentMediaId, sortKey } of sortKeys) {
        db.run(
          `UPDATE ${ASSORTMENT_MEDIA_TABLE} SET data = json_set(data, '$.sortKey', ?, '$.updated', ?) WHERE _id = ?`,
          [sortKey + 1, now, assortmentMediaId],
        );
        changedAssortmentMediaIds.push(assortmentMediaId);
      }

      if (changedAssortmentMediaIds.length === 0) return [];

      const placeholders = changedAssortmentMediaIds.map(() => '?').join(', ');
      const assortmentMedias = db.query<AssortmentMediaType>(
        `SELECT data FROM ${ASSORTMENT_MEDIA_TABLE} WHERE _id IN (${placeholders})`,
        changedAssortmentMediaIds,
      );

      await emit('ASSORTMENT_REORDER_MEDIA', { assortmentMedias });

      return assortmentMedias;
    },

    /*
     * Assortment Media Texts
     */

    texts: {
      // Queries
      findMediaTexts: async ({
        assortmentMediaId,
        assortmentMediaIds,
      }: {
        assortmentMediaId?: string;
        assortmentMediaIds?: string[];
      }): Promise<AssortmentMediaText[]> => {
        const where: Record<string, any> = {};

        if (assortmentMediaIds && assortmentMediaIds.length > 0) {
          where.assortmentMediaId = { $in: assortmentMediaIds };
        } else if (assortmentMediaId) {
          where.assortmentMediaId = assortmentMediaId;
        }

        if (Object.keys(where).length === 0) return [];

        return db.find<AssortmentMediaText>(ASSORTMENT_MEDIA_TEXTS_TABLE, {
          where,
          sort: { assortmentMediaId: 1 },
        });
      },

      findLocalizedMediaText: async ({
        assortmentMediaId,
        locale,
      }: {
        assortmentMediaId: string;
        locale: Intl.Locale;
      }): Promise<AssortmentMediaText | null> => {
        return db.findLocalizedText<AssortmentMediaText>(
          ASSORTMENT_MEDIA_TEXTS_TABLE,
          { assortment_media_id: assortmentMediaId },
          locale,
        );
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
