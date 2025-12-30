/**
 * Product Texts Module - Drizzle ORM with SQLite/Turso
 */

import { emit, registerEvents } from '@unchainedshop/events';
import { findUnusedSlug, systemLocale } from '@unchainedshop/utils';
import { eq, and, ne, inArray, notInArray, sql, generateId, type DrizzleDb } from '@unchainedshop/store';
import { productsSettings } from '../products-settings.ts';
import { products, productTexts, searchProductTextsFTS, type ProductTextRow } from '../db/index.ts';

const PRODUCT_TEXT_EVENTS = ['PRODUCT_UPDATE_TEXT'];

export type ProductText = ProductTextRow;

export const configureProductTextsModule = ({ db }: { db: DrizzleDb }) => {
  registerEvents(PRODUCT_TEXT_EVENTS);

  const makeSlug = async ({
    slug,
    title,
    productId,
  }: {
    slug?: string;
    title?: string;
    productId: string;
  }): Promise<string> => {
    const checkSlugIsUnique = async (newPotentialSlug: string) => {
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(productTexts)
        .where(and(ne(productTexts.productId, productId), eq(productTexts.slug, newPotentialSlug)))
        .limit(1);
      return (result?.count || 0) === 0;
    };

    const findSlug = findUnusedSlug(checkSlugIsUnique, { slugify: productsSettings.slugify });
    return findSlug({
      existingSlug: slug,
      title: title || productId,
    });
  };

  const upsertLocalizedText = async (
    productId: string,
    locale: Intl.Locale,
    text: Omit<Partial<ProductText>, 'productId' | 'locale'>,
  ): Promise<ProductText> => {
    const { slug: textSlug, title, ...textFields } = text;
    const slug = await makeSlug({
      slug: textSlug ?? undefined,
      title: title ?? undefined,
      productId,
    });

    // Try to find existing text
    const [existing] = await db
      .select()
      .from(productTexts)
      .where(and(eq(productTexts.productId, productId), eq(productTexts.locale, locale.baseName)))
      .limit(1);

    let productText: ProductText;

    if (existing) {
      // Update existing
      await db
        .update(productTexts)
        .set({
          title,
          updated: new Date(),
          ...(text.slug ? { slug } : {}),
          ...textFields,
        })
        .where(eq(productTexts._id, existing._id));

      const [updated] = await db
        .select()
        .from(productTexts)
        .where(eq(productTexts._id, existing._id))
        .limit(1);
      productText = updated;
    } else {
      // Insert new
      const textId = generateId();
      await db.insert(productTexts).values({
        _id: textId,
        created: new Date(),
        productId,
        locale: locale.baseName,
        title,
        slug,
        ...textFields,
      });

      const [inserted] = await db
        .select()
        .from(productTexts)
        .where(eq(productTexts._id, textId))
        .limit(1);
      productText = inserted;

      // Insert into FTS
      const labelsText = (text.labels || []).join(' ');
      await db.run(
        sql`INSERT INTO product_texts_fts(_id, productId, title, subtitle, brand, vendor, description, labels, slug)
            VALUES (${textId}, ${productId}, ${title || ''}, ${text.subtitle || ''}, ${text.brand || ''}, ${text.vendor || ''}, ${text.description || ''}, ${labelsText}, ${slug})`,
      );
    }

    // Update product slugs
    const [product] = await db.select().from(products).where(eq(products._id, productId)).limit(1);

    if (product) {
      const currentSlugs = product.slugs || [];
      if (!currentSlugs.includes(slug)) {
        await db
          .update(products)
          .set({
            updated: new Date(),
            slugs: [...currentSlugs, slug],
          })
          .where(eq(products._id, productId));

        // Update FTS for products
        const newSlugsText = [...currentSlugs, slug].join(' ');
        await db.run(sql`DELETE FROM products_fts WHERE _id = ${productId}`);
        await db.run(
          sql`INSERT INTO products_fts(_id, sku, slugs_text) VALUES (${productId}, ${product.warehousing?.sku || ''}, ${newSlugsText})`,
        );
      }
    }

    // Remove slug from other products
    const otherProducts = await db
      .select()
      .from(products)
      .where(
        and(
          ne(products._id, productId),
          sql`EXISTS (SELECT 1 FROM json_each(${products.slugs}) WHERE value = ${slug})`,
        ),
      );

    for (const otherProduct of otherProducts) {
      const filteredSlugs = (otherProduct.slugs || []).filter((s) => s !== slug);
      await db
        .update(products)
        .set({
          updated: new Date(),
          slugs: filteredSlugs,
        })
        .where(eq(products._id, otherProduct._id));
    }

    await emit('PRODUCT_UPDATE_TEXT', {
      productId,
      text: productText,
    });

    return productText;
  };

  return {
    // Queries
    findTexts: async (query: {
      productId?: string;
      productIds?: string[];
      queryString?: string;
    }): Promise<ProductText[]> => {
      const conditions: any[] = [];

      if (query.productId) {
        conditions.push(eq(productTexts.productId, query.productId));
      }
      if (query.productIds?.length) {
        conditions.push(inArray(productTexts.productId, query.productIds));
      }
      if (query.queryString) {
        const matchingProductIds = await searchProductTextsFTS(db, query.queryString);
        if (matchingProductIds.length === 0) {
          return [];
        }
        conditions.push(inArray(productTexts.productId, matchingProductIds));
      }

      if (conditions.length === 0) {
        return db.select().from(productTexts);
      }

      return db
        .select()
        .from(productTexts)
        .where(and(...conditions));
    },

    findLocalizedText: async ({
      productId,
      locale,
    }: {
      productId: string;
      locale: Intl.Locale;
    }): Promise<ProductText | null> => {
      // Try exact match first
      const [exactMatch] = await db
        .select()
        .from(productTexts)
        .where(and(eq(productTexts.productId, productId), eq(productTexts.locale, locale.baseName)))
        .limit(1);

      if (exactMatch) return exactMatch;

      // Try language only (without region)
      const [languageMatch] = await db
        .select()
        .from(productTexts)
        .where(
          and(
            eq(productTexts.productId, productId),
            sql`${productTexts.locale} LIKE ${locale.language + '%'}`,
          ),
        )
        .limit(1);

      if (languageMatch) return languageMatch;

      // Try system locale
      const [systemMatch] = await db
        .select()
        .from(productTexts)
        .where(
          and(eq(productTexts.productId, productId), eq(productTexts.locale, systemLocale.baseName)),
        )
        .limit(1);

      if (systemMatch) return systemMatch;

      // Return any text for this product
      const [anyMatch] = await db
        .select()
        .from(productTexts)
        .where(eq(productTexts.productId, productId))
        .limit(1);

      return anyMatch || null;
    },

    // Mutations
    updateTexts: async (
      productId: string,
      texts: ({
        locale: ProductText['locale'];
      } & Omit<Partial<ProductText>, 'productId' | 'locale'>)[],
    ): Promise<ProductText[]> => {
      const result = await Promise.all(
        texts.map(async ({ locale, ...text }) =>
          upsertLocalizedText(productId, new Intl.Locale(locale), text),
        ),
      );
      return result;
    },

    makeSlug,

    deleteMany: async ({
      productId,
      excludedProductIds,
    }: {
      productId?: string;
      excludedProductIds?: string[];
    }): Promise<number> => {
      if (productId) {
        // Get IDs to delete for FTS cleanup
        const toDelete = await db
          .select({ _id: productTexts._id })
          .from(productTexts)
          .where(eq(productTexts.productId, productId));

        for (const row of toDelete) {
          await db.run(sql`DELETE FROM product_texts_fts WHERE _id = ${row._id}`);
        }

        const result = await db.delete(productTexts).where(eq(productTexts.productId, productId));
        return result.rowsAffected || 0;
      } else if (excludedProductIds?.length) {
        const toDelete = await db
          .select({ _id: productTexts._id })
          .from(productTexts)
          .where(notInArray(productTexts.productId, excludedProductIds));

        for (const row of toDelete) {
          await db.run(sql`DELETE FROM product_texts_fts WHERE _id = ${row._id}`);
        }

        const result = await db
          .delete(productTexts)
          .where(notInArray(productTexts.productId, excludedProductIds));
        return result.rowsAffected || 0;
      }
      return 0;
    },
  };
};

export type ProductTextsModule = ReturnType<typeof configureProductTextsModule>;
