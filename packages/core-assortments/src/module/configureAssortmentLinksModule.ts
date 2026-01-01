import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateId,
  eq,
  and,
  or,
  inArray,
  notInArray,
  asc,
  desc,
  type DrizzleDb,
} from '@unchainedshop/store';
import { assortmentLinks, type AssortmentLink } from '../db/schema.ts';
import { walkUpFromAssortment } from '../utils/breadcrumbs/build-paths.ts';
import { type InvalidateCacheFn } from './configureAssortmentsModule.ts';

const ASSORTMENT_LINK_EVENTS = [
  'ASSORTMENT_ADD_LINK',
  'ASSORTMENT_REMOVE_LINK',
  'ASSORTMENT_REORDER_LINKS',
];

export const configureAssortmentLinksModule = ({
  db,
  invalidateCache,
}: {
  db: DrizzleDb;
  invalidateCache: InvalidateCacheFn;
}) => {
  registerEvents(ASSORTMENT_LINK_EVENTS);

  return {
    findLink: async ({
      assortmentLinkId,
      parentAssortmentId,
      childAssortmentId,
    }: {
      assortmentLinkId?: string;
      parentAssortmentId?: string;
      childAssortmentId?: string;
    }) => {
      if (assortmentLinkId) {
        const [result] = await db
          .select()
          .from(assortmentLinks)
          .where(eq(assortmentLinks._id, assortmentLinkId))
          .limit(1);
        return result || null;
      }

      if (parentAssortmentId && childAssortmentId) {
        const [result] = await db
          .select()
          .from(assortmentLinks)
          .where(
            and(
              eq(assortmentLinks.parentAssortmentId, parentAssortmentId),
              eq(assortmentLinks.childAssortmentId, childAssortmentId),
            ),
          )
          .limit(1);
        return result || null;
      }

      return null;
    },

    findLinks: async (
      {
        assortmentId,
        assortmentIds,
        parentAssortmentId,
        parentAssortmentIds,
      }: {
        assortmentId?: string;
        assortmentIds?: string[];
        parentAssortmentId?: string;
        parentAssortmentIds?: string[];
      },
      options?: { limit?: number; offset?: number },
    ): Promise<AssortmentLink[]> => {
      let condition: ReturnType<typeof eq> | ReturnType<typeof or> | undefined;

      if (parentAssortmentId) {
        condition = eq(assortmentLinks.parentAssortmentId, parentAssortmentId);
      } else if (parentAssortmentIds?.length) {
        condition = inArray(assortmentLinks.parentAssortmentId, parentAssortmentIds);
      } else if (assortmentId) {
        condition = or(
          eq(assortmentLinks.parentAssortmentId, assortmentId),
          eq(assortmentLinks.childAssortmentId, assortmentId),
        );
      } else if (assortmentIds?.length) {
        condition = or(
          inArray(assortmentLinks.parentAssortmentId, assortmentIds),
          inArray(assortmentLinks.childAssortmentId, assortmentIds),
        );
      }

      let query = condition
        ? db.select().from(assortmentLinks).where(condition).orderBy(asc(assortmentLinks.sortKey))
        : db.select().from(assortmentLinks).orderBy(asc(assortmentLinks.sortKey));

      if (options?.limit) {
        query = query.limit(options.limit) as typeof query;
      }
      if (options?.offset) {
        query = query.offset(options.offset) as typeof query;
      }

      return query;
    },

    create: async (
      doc: Omit<AssortmentLink, '_id' | 'created' | 'sortKey' | 'meta' | 'updated'> &
        Partial<Pick<AssortmentLink, '_id' | 'created' | 'sortKey' | 'meta' | 'updated'>>,
      options?: { skipInvalidation?: boolean },
    ) => {
      const {
        _id: assortmentLinkId,
        parentAssortmentId,
        childAssortmentId,
        sortKey,
        tags = [],
        ...rest
      } = doc;

      // Check for cycles
      const assortmentLinksPath = await walkUpFromAssortment({
        resolveAssortmentLinks: async (id: string) => {
          return db
            .select({
              _id: assortmentLinks._id,
              childAssortmentId: assortmentLinks.childAssortmentId,
              parentAssortmentId: assortmentLinks.parentAssortmentId,
            })
            .from(assortmentLinks)
            .where(eq(assortmentLinks.childAssortmentId, id))
            .orderBy(asc(assortmentLinks.sortKey), asc(assortmentLinks.parentAssortmentId));
        },
        assortmentId: parentAssortmentId,
      });

      const assortmentIdAlreadyPartOfGraphParents = assortmentLinksPath.some((path) =>
        path.links?.some(
          (l) => l.parentAssortmentId === childAssortmentId || l.childAssortmentId === childAssortmentId,
        ),
      );
      if (assortmentIdAlreadyPartOfGraphParents) throw Error('CyclicGraphNotSupported');

      const now = new Date();

      // Check if link already exists
      const [existing] = await db
        .select()
        .from(assortmentLinks)
        .where(
          and(
            eq(assortmentLinks.parentAssortmentId, parentAssortmentId),
            eq(assortmentLinks.childAssortmentId, childAssortmentId),
          ),
        )
        .limit(1);

      if (existing) {
        // Update existing
        const updateData: Partial<AssortmentLink> = {
          ...rest,
          tags,
          updated: now,
        };
        if (sortKey !== undefined && sortKey !== null) {
          updateData.sortKey = sortKey;
        }

        await db.update(assortmentLinks).set(updateData).where(eq(assortmentLinks._id, existing._id));

        const [updated] = await db
          .select()
          .from(assortmentLinks)
          .where(eq(assortmentLinks._id, existing._id))
          .limit(1);

        await emit('ASSORTMENT_ADD_LINK', { assortmentLink: updated });

        if (!options?.skipInvalidation) {
          await invalidateCache({ assortmentIds: [parentAssortmentId] });
        }

        return updated;
      }

      // Get next sort key if not provided
      let newSortKey = sortKey;
      if (newSortKey === undefined || newSortKey === null) {
        const [lastLink] = await db
          .select({ sortKey: assortmentLinks.sortKey })
          .from(assortmentLinks)
          .where(eq(assortmentLinks.parentAssortmentId, parentAssortmentId))
          .orderBy(desc(assortmentLinks.sortKey))
          .limit(1);
        newSortKey = (lastLink?.sortKey || 0) + 1;
      }

      const linkId = assortmentLinkId || generateId();
      await db.insert(assortmentLinks).values({
        _id: linkId,
        parentAssortmentId,
        childAssortmentId,
        sortKey: newSortKey,
        tags,
        created: now,
        ...rest,
      });

      const [assortmentLink] = await db
        .select()
        .from(assortmentLinks)
        .where(eq(assortmentLinks._id, linkId))
        .limit(1);

      await emit('ASSORTMENT_ADD_LINK', { assortmentLink });

      if (!options?.skipInvalidation) {
        await invalidateCache({ assortmentIds: [parentAssortmentId] });
      }

      return assortmentLink;
    },

    update: async (
      assortmentLinkId: string,
      doc: Partial<AssortmentLink>,
      options?: { skipInvalidation?: boolean },
    ) => {
      const now = new Date();

      await db
        .update(assortmentLinks)
        .set({ ...doc, updated: now })
        .where(eq(assortmentLinks._id, assortmentLinkId));

      const [assortmentLink] = await db
        .select()
        .from(assortmentLinks)
        .where(eq(assortmentLinks._id, assortmentLinkId))
        .limit(1);

      if (!options?.skipInvalidation && assortmentLink) {
        await invalidateCache({ assortmentIds: [assortmentLink.childAssortmentId] });
      }

      return assortmentLink || null;
    },

    delete: async (assortmentLinkId: string, options?: { skipInvalidation?: boolean }) => {
      const [assortmentLink] = await db
        .select()
        .from(assortmentLinks)
        .where(eq(assortmentLinks._id, assortmentLinkId))
        .limit(1);

      if (!assortmentLink) return null;

      await db.delete(assortmentLinks).where(eq(assortmentLinks._id, assortmentLinkId));

      await emit('ASSORTMENT_REMOVE_LINK', {
        assortmentLinkId: assortmentLink._id,
      });

      if (!options?.skipInvalidation) {
        await invalidateCache({
          assortmentIds: [assortmentLink.childAssortmentId, assortmentLink.parentAssortmentId],
        });
      }

      return assortmentLink;
    },

    deleteMany: async (
      selector: {
        parentAssortmentId?: string;
        childAssortmentId?: string;
        excludeIds?: string[];
      },
      options?: { skipInvalidation?: boolean },
    ): Promise<number> => {
      const conditions: ReturnType<typeof eq>[] = [];

      if (selector.parentAssortmentId) {
        conditions.push(eq(assortmentLinks.parentAssortmentId, selector.parentAssortmentId));
      }
      if (selector.childAssortmentId) {
        conditions.push(eq(assortmentLinks.childAssortmentId, selector.childAssortmentId));
      }
      if (selector.excludeIds?.length) {
        conditions.push(notInArray(assortmentLinks._id, selector.excludeIds));
      }

      if (conditions.length === 0) return 0;

      // Get links before deleting for events and cache invalidation
      const linksToDelete = await db
        .select({
          _id: assortmentLinks._id,
          childAssortmentId: assortmentLinks.childAssortmentId,
          parentAssortmentId: assortmentLinks.parentAssortmentId,
        })
        .from(assortmentLinks)
        .where(and(...conditions));

      if (linksToDelete.length === 0) return 0;

      const result = await db.delete(assortmentLinks).where(and(...conditions));

      await Promise.all(
        linksToDelete.map(async (link) =>
          emit('ASSORTMENT_REMOVE_LINK', {
            assortmentLinkId: link._id,
          }),
        ),
      );

      if (!options?.skipInvalidation && linksToDelete.length) {
        await invalidateCache({
          assortmentIds: linksToDelete.flatMap((link) => [
            link.childAssortmentId,
            link.parentAssortmentId,
          ]),
        });
      }

      return result.rowsAffected;
    },

    updateManualOrder: async (
      {
        sortKeys,
      }: {
        sortKeys: {
          assortmentLinkId: string;
          sortKey: number;
        }[];
      },
      options?: { skipInvalidation?: boolean },
    ): Promise<AssortmentLink[]> => {
      const now = new Date();
      const changedAssortmentLinkIds = await Promise.all(
        sortKeys.map(async ({ assortmentLinkId, sortKey }) => {
          await db
            .update(assortmentLinks)
            .set({
              sortKey: sortKey + 1,
              updated: now,
            })
            .where(eq(assortmentLinks._id, assortmentLinkId));
          return assortmentLinkId;
        }),
      );

      const updatedLinks = await db
        .select()
        .from(assortmentLinks)
        .where(inArray(assortmentLinks._id, changedAssortmentLinkIds));

      if (!options?.skipInvalidation && updatedLinks.length) {
        await invalidateCache({
          assortmentIds: updatedLinks.map((link) => link.childAssortmentId),
        });
      }

      await emit('ASSORTMENT_REORDER_LINKS', { assortmentLinks: updatedLinks });

      return updatedLinks;
    },
  };
};

export type AssortmentLinksModule = ReturnType<typeof configureAssortmentLinksModule>;
