/**
 * Product Variations Module - Drizzle ORM with SQLite/Turso
 */

import { emit, registerEvents } from '@unchainedshop/events';
import { systemLocale } from '@unchainedshop/utils';
import {
  eq,
  and,
  isNull,
  inArray,
  notInArray,
  like,
  sql,
  generateId,
  type DrizzleDb,
} from '@unchainedshop/store';
import {
  productVariations,
  productVariationTexts,
  ProductVariationType,
  type ProductVariationRow,
  type ProductVariationTextRow,
  type ProductVariationTypeType,
} from '../db/index.ts';

const PRODUCT_VARIATION_EVENTS = [
  'PRODUCT_CREATE_VARIATION',
  'PRODUCT_REMOVE_VARIATION',
  'PRODUCT_UPDATE_VARIATION_TEXT',
  'PRODUCT_VARIATION_OPTION_CREATE',
  'PRODUCT_REMOVE_VARIATION_OPTION',
];

export type ProductVariation = ProductVariationRow;
export type ProductVariationText = ProductVariationTextRow;
export { ProductVariationType, type ProductVariationTypeType };

export const configureProductVariationsModule = ({ db }: { db: DrizzleDb }) => {
  registerEvents(PRODUCT_VARIATION_EVENTS);

  const upsertLocalizedText = async (
    {
      productVariationId,
      productVariationOptionValue,
    }: {
      productVariationId: string;
      productVariationOptionValue?: string | null;
    },
    locale: Intl.Locale,
    text: Omit<
      Partial<ProductVariationText>,
      'locale' | 'productVariationId' | 'productVariationOptionValue'
    >,
  ): Promise<ProductVariationText> => {
    // Try to find existing text
    const conditions = [
      eq(productVariationTexts.productVariationId, productVariationId),
      eq(productVariationTexts.locale, locale.baseName),
    ];

    if (productVariationOptionValue) {
      conditions.push(
        eq(productVariationTexts.productVariationOptionValue, productVariationOptionValue),
      );
    } else {
      conditions.push(isNull(productVariationTexts.productVariationOptionValue));
    }

    const [existing] = await db
      .select()
      .from(productVariationTexts)
      .where(and(...conditions))
      .limit(1);

    let variationText: ProductVariationText;

    if (existing) {
      // Update existing
      await db
        .update(productVariationTexts)
        .set({
          ...text,
          updated: new Date(),
        })
        .where(eq(productVariationTexts._id, existing._id));

      const [updated] = await db
        .select()
        .from(productVariationTexts)
        .where(eq(productVariationTexts._id, existing._id))
        .limit(1);
      variationText = updated;
    } else {
      // Insert new
      const textId = generateId();
      await db.insert(productVariationTexts).values({
        _id: textId,
        productVariationId,
        productVariationOptionValue: productVariationOptionValue || null,
        locale: locale.baseName,
        ...text,
        created: new Date(),
      });

      const [inserted] = await db
        .select()
        .from(productVariationTexts)
        .where(eq(productVariationTexts._id, textId))
        .limit(1);
      variationText = inserted;
    }

    await emit('PRODUCT_UPDATE_VARIATION_TEXT', {
      productVariationId,
      productVariationOptionValue,
      text: variationText,
    });

    return variationText;
  };

  return {
    // Queries
    findProductVariationByKey: async ({
      productId,
      key,
    }: {
      productId: string;
      key: string;
    }): Promise<ProductVariation | null> => {
      const [result] = await db
        .select()
        .from(productVariations)
        .where(and(eq(productVariations.productId, productId), eq(productVariations.key, key)))
        .limit(1);
      return result || null;
    },

    findProductVariation: async ({
      productVariationId,
    }: {
      productVariationId: string;
    }): Promise<ProductVariation | null> => {
      const [result] = await db
        .select()
        .from(productVariations)
        .where(eq(productVariations._id, productVariationId))
        .limit(1);
      return result || null;
    },

    findProductVariations: async (query: {
      productId?: string;
      productIds?: string[];
      productVariationIds?: string[];
      tags?: string[];
      limit?: number;
      offset?: number;
    }): Promise<ProductVariation[]> => {
      const { productId, productIds, productVariationIds, tags, offset, limit } = query;
      const conditions: ReturnType<typeof eq>[] = [];

      if (productId) {
        conditions.push(eq(productVariations.productId, productId));
      }
      if (productIds?.length) {
        conditions.push(inArray(productVariations.productId, productIds));
      }
      if (productVariationIds?.length) {
        conditions.push(inArray(productVariations._id, productVariationIds));
      }
      if (tags?.length) {
        // All tags must be present
        for (const tag of tags) {
          conditions.push(
            sql`EXISTS (SELECT 1 FROM json_each(${productVariations.tags}) WHERE value = ${tag})`,
          );
        }
      }

      let dbQuery = db.select().from(productVariations);

      if (conditions.length > 0) {
        dbQuery = dbQuery.where(and(...conditions)) as typeof dbQuery;
      }

      if (offset !== undefined) {
        dbQuery = dbQuery.offset(offset) as typeof dbQuery;
      }
      if (limit !== undefined) {
        dbQuery = dbQuery.limit(limit) as typeof dbQuery;
      }

      return dbQuery;
    },

    create: async ({
      type,
      ...doc
    }: {
      type: string;
      productId: string;
      key: string;
      options?: string[];
      _id?: string;
      locale?: string;
      title?: string;
    } & Partial<
      Omit<ProductVariation, '_id' | 'type' | 'productId' | 'key'>
    >): Promise<ProductVariation> => {
      const variationId = doc._id || generateId();
      await db.insert(productVariations).values({
        _id: variationId,
        created: new Date(),
        type: ProductVariationType[type as keyof typeof ProductVariationType] || type,
        ...doc,
      });

      const [inserted] = await db
        .select()
        .from(productVariations)
        .where(eq(productVariations._id, variationId))
        .limit(1);

      await emit('PRODUCT_CREATE_VARIATION', {
        productVariation: inserted,
      });

      return inserted;
    },

    delete: async (productVariationId: string): Promise<number> => {
      // Delete associated texts
      await db
        .delete(productVariationTexts)
        .where(eq(productVariationTexts.productVariationId, productVariationId));

      // Delete variation
      const result = await db
        .delete(productVariations)
        .where(eq(productVariations._id, productVariationId));

      await emit('PRODUCT_REMOVE_VARIATION', {
        productVariationId,
      });

      return result.rowsAffected;
    },

    deleteVariations: async ({
      productId,
      excludedProductIds,
    }: {
      productId?: string;
      excludedProductIds?: string[];
    }): Promise<number> => {
      const conditions: ReturnType<typeof eq>[] = [];

      if (productId) {
        conditions.push(eq(productVariations.productId, productId));
      } else if (excludedProductIds?.length) {
        conditions.push(notInArray(productVariations.productId, excludedProductIds));
      }

      if (conditions.length === 0) return 0;

      // Get IDs to delete
      const toDelete = await db
        .select({ _id: productVariations._id })
        .from(productVariations)
        .where(and(...conditions));

      const ids = toDelete.map((row) => row._id);

      if (ids.length > 0) {
        // Delete texts
        await db
          .delete(productVariationTexts)
          .where(inArray(productVariationTexts.productVariationId, ids));
      }

      // Delete variations
      const result = await db.delete(productVariations).where(and(...conditions));
      return result.rowsAffected;
    },

    // This action is specifically used for the bulk migration scripts in the platform package
    update: async (
      productVariationId: string,
      doc: Partial<ProductVariation>,
    ): Promise<ProductVariation | null> => {
      await db
        .update(productVariations)
        .set({
          ...doc,
          updated: new Date(),
        })
        .where(eq(productVariations._id, productVariationId));

      const [updated] = await db
        .select()
        .from(productVariations)
        .where(eq(productVariations._id, productVariationId))
        .limit(1);

      return updated || null;
    },

    addVariationOption: async (
      productVariationId: string,
      { value }: { value: string },
    ): Promise<ProductVariation | null> => {
      const [current] = await db
        .select()
        .from(productVariations)
        .where(eq(productVariations._id, productVariationId))
        .limit(1);

      if (!current) return null;

      const currentOptions = current.options || [];
      if (currentOptions.includes(value)) {
        // Already exists
        return current;
      }

      await db
        .update(productVariations)
        .set({
          options: [...currentOptions, value],
          updated: new Date(),
        })
        .where(eq(productVariations._id, productVariationId));

      const [updated] = await db
        .select()
        .from(productVariations)
        .where(eq(productVariations._id, productVariationId))
        .limit(1);

      if (!updated) return null;

      await emit('PRODUCT_VARIATION_OPTION_CREATE', { productVariation: updated, value });
      return updated;
    },

    removeVariationOption: async (
      productVariationId: string,
      productVariationOptionValue: string,
    ): Promise<void> => {
      const [current] = await db
        .select()
        .from(productVariations)
        .where(eq(productVariations._id, productVariationId))
        .limit(1);

      if (!current) return;

      const updatedOptions = (current.options || []).filter(
        (opt) => opt !== productVariationOptionValue,
      );

      await db
        .update(productVariations)
        .set({
          options: updatedOptions,
          updated: new Date(),
        })
        .where(eq(productVariations._id, productVariationId));

      await emit('PRODUCT_REMOVE_VARIATION_OPTION', {
        productVariationId,
        productVariationOptionValue,
      });
    },

    /*
     * Product Variation Texts
     */

    texts: {
      // Queries
      findVariationTexts: async (query: {
        productVariationId?: string;
        productVariationIds?: string[];
        productVariationOptionValue?: string | null;
      }): Promise<ProductVariationText[]> => {
        const conditions: ReturnType<typeof eq>[] = [];

        if (query.productVariationId) {
          conditions.push(eq(productVariationTexts.productVariationId, query.productVariationId));
        }
        if (query.productVariationIds?.length) {
          conditions.push(inArray(productVariationTexts.productVariationId, query.productVariationIds));
        }
        if (query.productVariationOptionValue !== undefined) {
          if (query.productVariationOptionValue === null) {
            conditions.push(isNull(productVariationTexts.productVariationOptionValue));
          } else {
            conditions.push(
              eq(productVariationTexts.productVariationOptionValue, query.productVariationOptionValue),
            );
          }
        }

        if (conditions.length === 0) {
          return db.select().from(productVariationTexts);
        }

        return db
          .select()
          .from(productVariationTexts)
          .where(and(...conditions));
      },

      findLocalizedVariationText: async ({
        productVariationId,
        productVariationOptionValue,
        locale,
      }: {
        locale: Intl.Locale;
        productVariationId: string;
        productVariationOptionValue?: string;
      }): Promise<ProductVariationText | null> => {
        const baseConditions = [eq(productVariationTexts.productVariationId, productVariationId)];

        if (productVariationOptionValue) {
          baseConditions.push(
            eq(productVariationTexts.productVariationOptionValue, productVariationOptionValue),
          );
        } else {
          baseConditions.push(isNull(productVariationTexts.productVariationOptionValue));
        }

        // Try exact match first
        const [exactMatch] = await db
          .select()
          .from(productVariationTexts)
          .where(and(...baseConditions, eq(productVariationTexts.locale, locale.baseName)))
          .limit(1);

        if (exactMatch) return exactMatch;

        // Try language only (without region)
        const [languageMatch] = await db
          .select()
          .from(productVariationTexts)
          .where(and(...baseConditions, like(productVariationTexts.locale, locale.language + '%')))
          .limit(1);

        if (languageMatch) return languageMatch;

        // Try system locale
        const [systemMatch] = await db
          .select()
          .from(productVariationTexts)
          .where(and(...baseConditions, eq(productVariationTexts.locale, systemLocale.baseName)))
          .limit(1);

        if (systemMatch) return systemMatch;

        // Return any text for this variation
        const [anyMatch] = await db
          .select()
          .from(productVariationTexts)
          .where(and(...baseConditions))
          .limit(1);

        return anyMatch || null;
      },

      // Mutations
      updateVariationTexts: async (
        productVariationId: string,
        texts: ({ locale: ProductVariationText['locale'] } & Omit<
          Partial<ProductVariationText>,
          'locale' | 'productVariationId' | 'productVariationOptionValue'
        >)[],
        productVariationOptionValue?: string,
      ): Promise<ProductVariationText[]> => {
        const productVariationTextsList = await Promise.all(
          texts.map(async ({ locale, ...text }) =>
            upsertLocalizedText(
              {
                productVariationId,
                productVariationOptionValue,
              },
              new Intl.Locale(locale),
              text,
            ),
          ),
        );

        return productVariationTextsList;
      },
    },
  };
};

export type ProductVariationsModule = ReturnType<typeof configureProductVariationsModule>;
