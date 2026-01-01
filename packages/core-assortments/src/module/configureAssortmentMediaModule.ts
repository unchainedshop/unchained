import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateId,
  eq,
  and,
  inArray,
  notInArray,
  asc,
  desc,
  sql,
  type DrizzleDb,
} from '@unchainedshop/store';
import { SortDirection, type SortOption } from '@unchainedshop/utils';
import {
  assortmentMedia,
  assortmentMediaTexts,
  type AssortmentMediaType,
  type AssortmentMediaText,
} from '../db/schema.ts';

const ASSORTMENT_MEDIA_EVENTS = [
  'ASSORTMENT_ADD_MEDIA',
  'ASSORTMENT_REMOVE_MEDIA',
  'ASSORTMENT_REORDER_MEDIA',
  'ASSORTMENT_UPDATE_MEDIA_TEXT',
];

export const configureAssortmentMediaModule = ({ db }: { db: DrizzleDb }) => {
  registerEvents(ASSORTMENT_MEDIA_EVENTS);

  const upsertLocalizedText = async (
    assortmentMediaId: string,
    locale: Intl.Locale,
    text: Omit<Partial<AssortmentMediaText>, 'assortmentMediaId' | 'locale'>,
  ) => {
    const localeString = locale.baseName;
    const now = new Date();

    // Check if exists
    const [existing] = await db
      .select()
      .from(assortmentMediaTexts)
      .where(
        and(
          eq(assortmentMediaTexts.assortmentMediaId, assortmentMediaId),
          eq(assortmentMediaTexts.locale, localeString),
        ),
      )
      .limit(1);

    let assortmentMediaText: AssortmentMediaText;

    if (existing) {
      await db
        .update(assortmentMediaTexts)
        .set({
          title: text.title,
          subtitle: text.subtitle,
          updated: now,
        })
        .where(eq(assortmentMediaTexts._id, existing._id));

      [assortmentMediaText] = await db
        .select()
        .from(assortmentMediaTexts)
        .where(eq(assortmentMediaTexts._id, existing._id))
        .limit(1);
    } else {
      const textId = generateId();
      await db.insert(assortmentMediaTexts).values({
        _id: textId,
        assortmentMediaId,
        locale: localeString,
        title: text.title,
        subtitle: text.subtitle,
        created: now,
      });

      [assortmentMediaText] = await db
        .select()
        .from(assortmentMediaTexts)
        .where(eq(assortmentMediaTexts._id, textId))
        .limit(1);
    }

    await emit('ASSORTMENT_UPDATE_MEDIA_TEXT', {
      assortmentMediaId,
      text: assortmentMediaText,
    });

    return assortmentMediaText;
  };

  return {
    findAssortmentMedia: async ({ assortmentMediaId }: { assortmentMediaId: string }) => {
      const [result] = await db
        .select()
        .from(assortmentMedia)
        .where(eq(assortmentMedia._id, assortmentMediaId))
        .limit(1);
      return result || null;
    },

    findAssortmentMedias: async ({
      assortmentId,
      assortmentIds,
      tags,
      offset,
      limit,
    }: {
      assortmentId?: string;
      assortmentIds?: string[];
      limit?: number;
      offset?: number;
      tags?: string[];
    }): Promise<AssortmentMediaType[]> => {
      const conditions: ReturnType<typeof eq>[] = [];

      if (assortmentId) {
        conditions.push(eq(assortmentMedia.assortmentId, assortmentId));
      }
      if (assortmentIds?.length) {
        conditions.push(inArray(assortmentMedia.assortmentId, assortmentIds));
      }
      if (tags?.length) {
        // All tags must match
        for (const tag of tags) {
          conditions.push(
            sql`EXISTS (SELECT 1 FROM json_each(${assortmentMedia.tags}) WHERE value = ${tag})` as ReturnType<
              typeof eq
            >,
          );
        }
      }

      let queryBuilder = db.select().from(assortmentMedia);

      if (conditions.length > 0) {
        queryBuilder = queryBuilder.where(and(...conditions)) as typeof queryBuilder;
      }

      queryBuilder = queryBuilder.orderBy(asc(assortmentMedia.sortKey)) as typeof queryBuilder;

      if (offset !== undefined) {
        queryBuilder = queryBuilder.offset(offset) as typeof queryBuilder;
      }

      if (limit !== undefined && limit > 0) {
        queryBuilder = queryBuilder.limit(limit) as typeof queryBuilder;
      }

      return queryBuilder;
    },

    create: async ({
      sortKey,
      tags = [],
      ...doc
    }: Omit<AssortmentMediaType, 'sortKey' | 'tags' | '_id' | 'created' | 'meta' | 'updated'> &
      Partial<
        Pick<AssortmentMediaType, 'sortKey' | 'tags' | '_id' | 'created' | 'meta' | 'updated'>
      >) => {
      const now = new Date();

      // Get next sort key if not provided
      let newSortKey = sortKey;
      if (newSortKey === undefined || newSortKey === null) {
        const [lastMedia] = await db
          .select({ sortKey: assortmentMedia.sortKey })
          .from(assortmentMedia)
          .where(eq(assortmentMedia.assortmentId, doc.assortmentId))
          .orderBy(desc(assortmentMedia.sortKey))
          .limit(1);
        newSortKey = (lastMedia?.sortKey || 0) + 1;
      }

      const mediaId = generateId();
      await db.insert(assortmentMedia).values({
        _id: mediaId,
        created: now,
        tags,
        sortKey: newSortKey,
        ...doc,
      });

      const [media] = await db
        .select()
        .from(assortmentMedia)
        .where(eq(assortmentMedia._id, mediaId))
        .limit(1);

      await emit('ASSORTMENT_ADD_MEDIA', { assortmentMedia: media });

      return media;
    },

    delete: async (assortmentMediaId: string): Promise<number> => {
      // Delete associated texts
      await db
        .delete(assortmentMediaTexts)
        .where(eq(assortmentMediaTexts.assortmentMediaId, assortmentMediaId));

      const result = await db.delete(assortmentMedia).where(eq(assortmentMedia._id, assortmentMediaId));

      await emit('ASSORTMENT_REMOVE_MEDIA', { assortmentMediaId });

      return result.rowsAffected;
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
      const conditions: ReturnType<typeof eq>[] = [];

      if (assortmentId) {
        conditions.push(eq(assortmentMedia.assortmentId, assortmentId));
      } else if (excludedAssortmentIds?.length) {
        conditions.push(notInArray(assortmentMedia.assortmentId, excludedAssortmentIds));
      }

      if (excludedAssortmentMediaIds?.length) {
        conditions.push(notInArray(assortmentMedia._id, excludedAssortmentMediaIds));
      }

      // Get IDs first for events and text deletion
      let mediaToDelete: { _id: string }[] = [];
      if (conditions.length > 0) {
        mediaToDelete = await db
          .select({ _id: assortmentMedia._id })
          .from(assortmentMedia)
          .where(and(...conditions));
      } else {
        mediaToDelete = await db.select({ _id: assortmentMedia._id }).from(assortmentMedia);
      }

      if (mediaToDelete.length === 0) return 0;

      const mediaIds = mediaToDelete.map((m) => m._id);

      // Delete associated texts
      await db
        .delete(assortmentMediaTexts)
        .where(inArray(assortmentMediaTexts.assortmentMediaId, mediaIds));

      // Delete media
      const result = await db.delete(assortmentMedia).where(inArray(assortmentMedia._id, mediaIds));

      await Promise.all(
        mediaIds.map(async (id) => emit('ASSORTMENT_REMOVE_MEDIA', { assortmentMediaId: id })),
      );

      return result.rowsAffected;
    },

    update: async (assortmentMediaId: string, doc: Partial<AssortmentMediaType>) => {
      const now = new Date();

      await db
        .update(assortmentMedia)
        .set({ ...doc, updated: now })
        .where(eq(assortmentMedia._id, assortmentMediaId));

      const [result] = await db
        .select()
        .from(assortmentMedia)
        .where(eq(assortmentMedia._id, assortmentMediaId))
        .limit(1);

      return result || null;
    },

    updateManualOrder: async ({
      sortKeys,
    }: {
      sortKeys: {
        assortmentMediaId: string;
        sortKey: number;
      }[];
    }): Promise<AssortmentMediaType[]> => {
      const now = new Date();
      const changedAssortmentMediaIds = await Promise.all(
        sortKeys.map(async ({ assortmentMediaId, sortKey }) => {
          await db
            .update(assortmentMedia)
            .set({
              sortKey: sortKey + 1,
              updated: now,
            })
            .where(eq(assortmentMedia._id, assortmentMediaId));
          return assortmentMediaId;
        }),
      );

      const updatedMedias = await db
        .select()
        .from(assortmentMedia)
        .where(inArray(assortmentMedia._id, changedAssortmentMediaIds));

      await emit('ASSORTMENT_REORDER_MEDIA', { assortmentMedias: updatedMedias });

      return updatedMedias;
    },

    texts: {
      findMediaTexts: async (
        query: { assortmentMediaId?: string; assortmentMediaIds?: string[] },
        options?: { limit?: number; offset?: number; sort?: SortOption[] },
      ): Promise<AssortmentMediaText[]> => {
        const conditions: ReturnType<typeof eq>[] = [];

        if (query.assortmentMediaId) {
          conditions.push(eq(assortmentMediaTexts.assortmentMediaId, query.assortmentMediaId));
        }
        if (query.assortmentMediaIds?.length) {
          conditions.push(inArray(assortmentMediaTexts.assortmentMediaId, query.assortmentMediaIds));
        }

        const MEDIA_TEXT_COLUMNS = {
          _id: assortmentMediaTexts._id,
          assortmentMediaId: assortmentMediaTexts.assortmentMediaId,
          locale: assortmentMediaTexts.locale,
          title: assortmentMediaTexts.title,
          subtitle: assortmentMediaTexts.subtitle,
          created: assortmentMediaTexts.created,
          updated: assortmentMediaTexts.updated,
        } as const;

        const orderBy = options?.sort?.length
          ? options.sort.map(({ key, value }) => {
              const column =
                MEDIA_TEXT_COLUMNS[key as keyof typeof MEDIA_TEXT_COLUMNS] ??
                assortmentMediaTexts.created;
              return value === SortDirection.DESC ? desc(column) : asc(column);
            })
          : [asc(assortmentMediaTexts.created)];

        let queryBuilder =
          conditions.length === 0
            ? db
                .select()
                .from(assortmentMediaTexts)
                .orderBy(...orderBy)
            : db
                .select()
                .from(assortmentMediaTexts)
                .where(and(...conditions))
                .orderBy(...orderBy);

        if (options?.limit) {
          queryBuilder = queryBuilder.limit(options.limit) as typeof queryBuilder;
        }
        if (options?.offset) {
          queryBuilder = queryBuilder.offset(options.offset) as typeof queryBuilder;
        }

        return queryBuilder;
      },

      findLocalizedMediaText: async ({
        assortmentMediaId,
        locale,
      }: {
        assortmentMediaId: string;
        locale: Intl.Locale;
      }): Promise<AssortmentMediaText | null> => {
        const localeString = locale.baseName;
        const languageCode = locale.language;

        // Try exact locale match first
        let [text] = await db
          .select()
          .from(assortmentMediaTexts)
          .where(
            and(
              eq(assortmentMediaTexts.assortmentMediaId, assortmentMediaId),
              eq(assortmentMediaTexts.locale, localeString),
            ),
          )
          .limit(1);

        if (text) return text;

        // Try language code only
        if (localeString !== languageCode) {
          [text] = await db
            .select()
            .from(assortmentMediaTexts)
            .where(
              and(
                eq(assortmentMediaTexts.assortmentMediaId, assortmentMediaId),
                eq(assortmentMediaTexts.locale, languageCode),
              ),
            )
            .limit(1);

          if (text) return text;
        }

        // Fallback to any available text
        [text] = await db
          .select()
          .from(assortmentMediaTexts)
          .where(eq(assortmentMediaTexts.assortmentMediaId, assortmentMediaId))
          .limit(1);

        return text || null;
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

export type AssortmentMediaModule = ReturnType<typeof configureAssortmentMediaModule>;
