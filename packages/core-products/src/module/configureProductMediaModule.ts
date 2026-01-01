/**
 * Product Media Module - Drizzle ORM with SQLite/Turso
 */

import { emit, registerEvents } from '@unchainedshop/events';
import { systemLocale } from '@unchainedshop/utils';
import {
  eq,
  and,
  inArray,
  notInArray,
  desc,
  asc,
  like,
  sql,
  generateId,
  type DrizzleDb,
} from '@unchainedshop/store';
import {
  productMedia,
  productMediaTexts,
  type ProductMediaRow,
  type ProductMediaTextRow,
} from '../db/index.ts';

const PRODUCT_MEDIA_EVENTS = [
  'PRODUCT_ADD_MEDIA',
  'PRODUCT_REMOVE_MEDIA',
  'PRODUCT_REORDER_MEDIA',
  'PRODUCT_UPDATE_MEDIA_TEXT',
];

export type ProductMedia = ProductMediaRow;
export type ProductMediaText = ProductMediaTextRow;

export const configureProductMediaModule = ({ db }: { db: DrizzleDb }) => {
  registerEvents(PRODUCT_MEDIA_EVENTS);

  const upsertLocalizedText = async (
    productMediaId: string,
    locale: Intl.Locale,
    text: Omit<Partial<ProductMediaText>, 'productMediaId' | 'locale'>,
  ): Promise<ProductMediaText> => {
    // Try to find existing text
    const [existing] = await db
      .select()
      .from(productMediaTexts)
      .where(
        and(
          eq(productMediaTexts.productMediaId, productMediaId),
          eq(productMediaTexts.locale, locale.baseName),
        ),
      )
      .limit(1);

    let mediaText: ProductMediaText;

    if (existing) {
      // Update existing
      await db
        .update(productMediaTexts)
        .set({
          title: text.title,
          subtitle: text.subtitle,
          updated: new Date(),
        })
        .where(eq(productMediaTexts._id, existing._id));

      const [updated] = await db
        .select()
        .from(productMediaTexts)
        .where(eq(productMediaTexts._id, existing._id))
        .limit(1);
      mediaText = updated;
    } else {
      // Insert new
      const textId = generateId();
      await db.insert(productMediaTexts).values({
        _id: textId,
        productMediaId,
        locale: locale.baseName,
        title: text.title,
        subtitle: text.subtitle,
        created: new Date(),
      });

      const [inserted] = await db
        .select()
        .from(productMediaTexts)
        .where(eq(productMediaTexts._id, textId))
        .limit(1);
      mediaText = inserted;
    }

    await emit('PRODUCT_UPDATE_MEDIA_TEXT', {
      productMediaId,
      text: mediaText,
    });

    return mediaText;
  };

  return {
    // Queries
    findProductMedia: async ({
      productMediaId,
    }: {
      productMediaId: string;
    }): Promise<ProductMedia | null> => {
      const [result] = await db
        .select()
        .from(productMedia)
        .where(eq(productMedia._id, productMediaId))
        .limit(1);
      return result || null;
    },

    findProductMedias: async ({
      productId,
      productIds,
      tags,
      offset,
      limit,
    }: {
      productId?: string;
      productIds?: string[];
      limit?: number;
      offset?: number;
      tags?: string[];
    }): Promise<ProductMedia[]> => {
      const conditions: ReturnType<typeof eq>[] = [];

      if (productId) {
        conditions.push(eq(productMedia.productId, productId));
      }
      if (productIds?.length) {
        conditions.push(inArray(productMedia.productId, productIds));
      }
      if (tags?.length) {
        // All tags must be present
        for (const tag of tags) {
          conditions.push(
            sql`EXISTS (SELECT 1 FROM json_each(${productMedia.tags}) WHERE value = ${tag})`,
          );
        }
      }

      let query = db.select().from(productMedia);

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
      }

      query = query.orderBy(asc(productMedia.sortKey)) as typeof query;

      if (offset !== undefined) {
        query = query.offset(offset) as typeof query;
      }
      if (limit !== undefined) {
        query = query.limit(limit) as typeof query;
      }

      return query;
    },

    // Mutations
    create: async ({
      sortKey,
      ...doc
    }: {
      productId: string;
      mediaId: string;
      sortKey?: number;
      tags?: string[];
      meta?: unknown;
      _id?: string;
    }): Promise<ProductMedia> => {
      let finalSortKey = sortKey;

      if (finalSortKey === undefined || finalSortKey === null) {
        // Get next sort key
        const [lastMedia] = await db
          .select({ sortKey: productMedia.sortKey })
          .from(productMedia)
          .where(eq(productMedia.productId, doc.productId))
          .orderBy(desc(productMedia.sortKey))
          .limit(1);

        finalSortKey = (lastMedia?.sortKey || 0) + 1;
      }

      const mediaId = doc._id || generateId();
      await db.insert(productMedia).values({
        _id: mediaId,
        created: new Date(),
        tags: [],
        ...doc,
        sortKey: finalSortKey,
      });

      const [inserted] = await db
        .select()
        .from(productMedia)
        .where(eq(productMedia._id, mediaId))
        .limit(1);

      await emit('PRODUCT_ADD_MEDIA', {
        productMedia: inserted,
      });

      return inserted;
    },

    delete: async (productMediaId: string): Promise<number> => {
      // Delete associated texts
      await db.delete(productMediaTexts).where(eq(productMediaTexts.productMediaId, productMediaId));

      // Delete media
      const result = await db.delete(productMedia).where(eq(productMedia._id, productMediaId));

      await emit('PRODUCT_REMOVE_MEDIA', {
        productMediaId,
      });

      return result.rowsAffected;
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
      const conditions: ReturnType<typeof eq>[] = [];

      if (productId) {
        conditions.push(eq(productMedia.productId, productId));
      } else if (excludedProductIds?.length) {
        conditions.push(notInArray(productMedia.productId, excludedProductIds));
      }

      if (excludedProductMediaIds?.length) {
        conditions.push(notInArray(productMedia._id, excludedProductMediaIds));
      }

      // Get IDs to delete
      let selectQuery = db.select({ _id: productMedia._id }).from(productMedia);
      if (conditions.length > 0) {
        selectQuery = selectQuery.where(and(...conditions)) as typeof selectQuery;
      }
      const toDelete = await selectQuery;

      const ids = toDelete.map((row) => row._id);

      if (ids.length > 0) {
        // Delete texts
        await db.delete(productMediaTexts).where(inArray(productMediaTexts.productMediaId, ids));

        // Delete media
        const result = await db.delete(productMedia).where(inArray(productMedia._id, ids));

        // Emit events
        await Promise.all(
          ids.map(async (mediaId) =>
            emit('PRODUCT_REMOVE_MEDIA', {
              productMediaId: mediaId,
            }),
          ),
        );

        return result.rowsAffected;
      }

      return 0;
    },

    // This action is specifically used for the bulk migration scripts in the platform package
    update: async (productMediaId: string, doc: Partial<ProductMedia>): Promise<ProductMedia | null> => {
      await db
        .update(productMedia)
        .set({
          ...doc,
          updated: new Date(),
        })
        .where(eq(productMedia._id, productMediaId));

      const [updated] = await db
        .select()
        .from(productMedia)
        .where(eq(productMedia._id, productMediaId))
        .limit(1);

      return updated || null;
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
          await db
            .update(productMedia)
            .set({
              sortKey: sortKey + 1,
              updated: new Date(),
            })
            .where(eq(productMedia._id, productMediaId));

          return productMediaId;
        }),
      );

      const productMedias = await db
        .select()
        .from(productMedia)
        .where(inArray(productMedia._id, changedProductMediaIds))
        .orderBy(asc(productMedia.sortKey));

      await emit('PRODUCT_REORDER_MEDIA', { productMedias });

      return productMedias;
    },

    /*
     * Product Media Texts
     */

    texts: {
      // Queries
      findMediaTexts: async (query: {
        productMediaId?: string;
        productMediaIds?: string[];
      }): Promise<ProductMediaText[]> => {
        const conditions: ReturnType<typeof eq>[] = [];

        if (query.productMediaId) {
          conditions.push(eq(productMediaTexts.productMediaId, query.productMediaId));
        }
        if (query.productMediaIds?.length) {
          conditions.push(inArray(productMediaTexts.productMediaId, query.productMediaIds));
        }

        if (conditions.length === 0) {
          return db.select().from(productMediaTexts);
        }

        return db
          .select()
          .from(productMediaTexts)
          .where(and(...conditions));
      },

      findLocalizedMediaText: async ({
        productMediaId,
        locale,
      }: {
        productMediaId: string;
        locale: Intl.Locale;
      }): Promise<ProductMediaText | null> => {
        // Try exact match first
        const [exactMatch] = await db
          .select()
          .from(productMediaTexts)
          .where(
            and(
              eq(productMediaTexts.productMediaId, productMediaId),
              eq(productMediaTexts.locale, locale.baseName),
            ),
          )
          .limit(1);

        if (exactMatch) return exactMatch;

        // Try language only (without region)
        const [languageMatch] = await db
          .select()
          .from(productMediaTexts)
          .where(
            and(
              eq(productMediaTexts.productMediaId, productMediaId),
              like(productMediaTexts.locale, locale.language + '%'),
            ),
          )
          .limit(1);

        if (languageMatch) return languageMatch;

        // Try system locale
        const [systemMatch] = await db
          .select()
          .from(productMediaTexts)
          .where(
            and(
              eq(productMediaTexts.productMediaId, productMediaId),
              eq(productMediaTexts.locale, systemLocale.baseName),
            ),
          )
          .limit(1);

        if (systemMatch) return systemMatch;

        // Return any text for this media
        const [anyMatch] = await db
          .select()
          .from(productMediaTexts)
          .where(eq(productMediaTexts.productMediaId, productMediaId))
          .limit(1);

        return anyMatch || null;
      },

      // Mutations
      updateMediaTexts: async (
        productMediaId: string,
        texts: ({ locale: ProductMediaText['locale'] } & Omit<
          Partial<ProductMediaText>,
          'productMediaId' | 'locale'
        >)[],
      ): Promise<ProductMediaText[]> => {
        const mediaTexts = await Promise.all(
          texts.map(async ({ locale, ...text }) =>
            upsertLocalizedText(productMediaId, new Intl.Locale(locale), text),
          ),
        );

        return mediaTexts;
      },
    },
  };
};

export type ProductMediaModule = ReturnType<typeof configureProductMediaModule>;
