import { emit, registerEvents } from '@unchainedshop/events';
import { type Database, generateId, toSqliteDate, type FindOptions } from '@unchainedshop/sqlite';
import { findUnusedSlug } from '@unchainedshop/utils';
import { assortmentsSettings } from '../assortments-settings.ts';
import {
  type AssortmentText,
  ASSORTMENT_TEXTS_TABLE,
  ASSORTMENTS_TABLE,
} from '../db/AssortmentsCollection.ts';

const ASSORTMENT_TEXT_EVENTS = ['ASSORTMENT_UPDATE_TEXT'];

export const configureAssortmentTextsModule = ({ db }: { db: Database }) => {
  registerEvents(ASSORTMENT_TEXT_EVENTS);

  const makeSlug = async ({
    slug,
    title,
    assortmentId,
  }: {
    slug?: string;
    title?: string;
    assortmentId: string;
  }): Promise<string> => {
    const checkSlugIsUnique = async (newPotentialSlug: string) => {
      // Query using virtual column for slug
      const existing = db.findOne<AssortmentText>(ASSORTMENT_TEXTS_TABLE, {
        where: { slug: newPotentialSlug },
      });
      // Slug is unique if no document found, or if found document belongs to same assortment
      return !existing || existing.assortmentId === assortmentId;
    };

    const findSlug = findUnusedSlug(checkSlugIsUnique, { slugify: assortmentsSettings.slugify });
    return findSlug({
      existingSlug: slug,
      title: title || assortmentId,
    });
  };

  const upsertLocalizedText = async (
    assortmentId: string,
    locale: Intl.Locale,
    text: Omit<Partial<AssortmentText>, 'assortmentId' | 'locale'>,
  ) => {
    const { slug: textSlug, ...textFields } = text;
    const slug = await makeSlug({
      slug: textSlug,
      title: text.title,
      assortmentId,
    });

    const now = new Date();
    const localeStr = locale.baseName;

    // Check if exists
    const existing = db.findOne<AssortmentText>(ASSORTMENT_TEXTS_TABLE, {
      where: { assortmentId, locale: localeStr },
    });

    let assortmentText: AssortmentText;

    if (existing) {
      // Update existing using document pattern
      const updates: Partial<AssortmentText> = {
        ...textFields,
        updated: now,
      };
      if (text.slug) {
        updates.slug = slug;
      }
      assortmentText = db.update<AssortmentText>(ASSORTMENT_TEXTS_TABLE, existing._id, updates)!;
    } else {
      // Insert new document
      assortmentText = db.insert<AssortmentText>(ASSORTMENT_TEXTS_TABLE, {
        _id: generateId(),
        assortmentId,
        locale: localeStr,
        title: textFields.title,
        subtitle: textFields.subtitle,
        description: textFields.description,
        slug,
        created: now,
      } as AssortmentText);
    }

    // Update assortment slugs - add the new slug
    const assortment = db.findById<{ _id: string; slugs?: string[]; [key: string]: any }>(
      ASSORTMENTS_TABLE,
      assortmentId,
    );
    if (assortment) {
      let slugs: string[] = assortment.slugs || [];
      if (!slugs.includes(slug)) {
        slugs = [...slugs, slug];
        db.run(
          `UPDATE ${ASSORTMENTS_TABLE} SET data = json_set(data, '$.slugs', json(?), '$.updated', ?) WHERE _id = ?`,
          [JSON.stringify(slugs), toSqliteDate(now), assortmentId],
        );
      }
    }

    // Remove this slug from other assortments
    // Query assortments where slugs JSON array contains this slug
    const otherAssortments = db.query<{ _id: string; slugs?: string[] }>(
      `SELECT data FROM ${ASSORTMENTS_TABLE} WHERE _id != ? AND EXISTS (SELECT 1 FROM json_each(json_extract(data, '$.slugs')) WHERE value = ?)`,
      [assortmentId, slug],
    );

    for (const otherAssortment of otherAssortments) {
      const filteredSlugs = (otherAssortment.slugs || []).filter((s) => s !== slug);
      db.run(
        `UPDATE ${ASSORTMENTS_TABLE} SET data = json_set(data, '$.slugs', json(?), '$.updated', ?) WHERE _id = ?`,
        [JSON.stringify(filteredSlugs), toSqliteDate(now), otherAssortment._id],
      );
    }

    await emit('ASSORTMENT_UPDATE_TEXT', {
      assortmentId,
      text: assortmentText,
    });

    return assortmentText;
  };

  return {
    // Queries
    findTexts: async (
      selector: { assortmentId?: string; assortmentIds?: string[]; locale?: string },
      options?: FindOptions,
    ): Promise<AssortmentText[]> => {
      const { assortmentId, assortmentIds, locale } = selector;
      const where: Record<string, any> = {};

      if (assortmentIds && assortmentIds.length > 0) {
        where.assortmentId = { $in: assortmentIds };
      } else if (assortmentId) {
        where.assortmentId = assortmentId;
      }

      if (locale) {
        where.locale = locale;
      }

      // Default sort by assortmentId if not specified
      const effectiveOptions = options ? { ...options } : {};
      if (!effectiveOptions.sort) {
        effectiveOptions.sort = { assortmentId: 1 };
      }

      return db.find<AssortmentText>(ASSORTMENT_TEXTS_TABLE, {
        where,
        ...effectiveOptions,
      });
    },

    findLocalizedText: async ({
      assortmentId,
      locale,
    }: {
      assortmentId: string;
      locale: Intl.Locale;
    }): Promise<AssortmentText | null> => {
      return db.findLocalizedText<AssortmentText>(
        ASSORTMENT_TEXTS_TABLE,
        { assortment_id: assortmentId },
        locale,
      );
    },

    // Mutations
    updateTexts: async (
      assortmentId: string,
      texts: ({
        locale: AssortmentText['locale'];
      } & Omit<Partial<AssortmentText>, 'assortmentId' | 'locale'>)[],
    ): Promise<AssortmentText[]> => {
      const assortmentTexts = (
        await Promise.all(
          texts.map(async ({ locale, ...text }) =>
            upsertLocalizedText(assortmentId, new Intl.Locale(locale), text),
          ),
        )
      ).filter(Boolean) as AssortmentText[];
      return assortmentTexts;
    },

    makeSlug,

    deleteMany: async ({
      assortmentId,
      excludedAssortmentIds,
    }: {
      assortmentId?: string;
      excludedAssortmentIds?: string[];
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

      if (conditions.length === 0) {
        return 0;
      }

      const { changes } = db.run(
        `DELETE FROM ${ASSORTMENT_TEXTS_TABLE} WHERE ${conditions.join(' AND ')}`,
        params,
      );
      return changes;
    },
  };
};

export type AssortmentTextsModule = ReturnType<typeof configureAssortmentTextsModule>;
