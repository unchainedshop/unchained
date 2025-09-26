import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbObjectId, mongodb } from '@unchainedshop/mongodb';
import { walkUpFromAssortment } from '../utils/breadcrumbs/build-paths.js';
import { AssortmentLink, InvalidateCacheFn } from '../db/AssortmentsCollection.js';

const ASSORTMENT_LINK_EVENTS = [
  'ASSORTMENT_ADD_LINK',
  'ASSORTMENT_REMOVE_LINK',
  'ASSORTMENT_REORDER_LINKS',
];

export const configureAssortmentLinksModule = ({
  AssortmentLinks,
  invalidateCache,
}: {
  AssortmentLinks: mongodb.Collection<AssortmentLink>;
  invalidateCache: InvalidateCacheFn;
}) => {
  registerEvents(ASSORTMENT_LINK_EVENTS);

  return {
    // Queries
    findLink: async ({
      assortmentLinkId,
      parentAssortmentId,
      childAssortmentId,
    }: {
      assortmentLinkId?: string;
      parentAssortmentId?: string;
      childAssortmentId?: string;
    }) => {
      return AssortmentLinks.findOne(
        assortmentLinkId
          ? generateDbFilterById(assortmentLinkId)
          : { parentAssortmentId, childAssortmentId },
        {},
      );
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
      options?: mongodb.FindOptions,
    ): Promise<AssortmentLink[]> => {
      const selector =
        parentAssortmentId || parentAssortmentIds
          ? {
              parentAssortmentId: parentAssortmentId || { $in: parentAssortmentIds },
            }
          : {
              $or: [
                { parentAssortmentId: assortmentId || { $in: assortmentIds } },
                { childAssortmentId: assortmentId || { $in: assortmentIds } },
              ],
            };

      const links = AssortmentLinks.find(
        selector,
        options || {
          sort: { sortKey: 1 },
        },
      );

      return links.toArray();
    },

    // Mutations
    create: async (
      doc: Omit<AssortmentLink, '_id' | 'created'> & Pick<Partial<AssortmentLink>, '_id' | 'created'>,
      options?: { skipInvalidation?: boolean },
    ) => {
      const { _id: assortmentLinkId, parentAssortmentId, childAssortmentId, sortKey, ...rest } = doc;

      const assortmentLinksPath = await walkUpFromAssortment({
        resolveAssortmentLinks: async (id: string) => {
          return AssortmentLinks.find(
            { childAssortmentId: id },
            {
              projection: { _id: 1, childAssortmentId: 1, parentAssortmentId: 1 },
              sort: { sortKey: 1, parentAssortmentId: 1 },
            },
          ).toArray();
        },
        assortmentId: parentAssortmentId,
      });
      const assortmentIdAlreadyPartOfGraphParents = assortmentLinksPath.some((path) =>
        path.links?.some(
          (l) => l.parentAssortmentId === childAssortmentId || l.childAssortmentId === childAssortmentId,
        ),
      );
      if (assortmentIdAlreadyPartOfGraphParents) throw Error('CyclicGraphNotSupported');

      const $set: mongodb.UpdateFilter<AssortmentLink> = {
        updated: new Date(),
        ...rest,
      };
      const $setOnInsert: mongodb.UpdateFilter<AssortmentLink> = {
        _id: assortmentLinkId || generateDbObjectId(),
        parentAssortmentId,
        childAssortmentId,
        created: new Date(),
      };

      if (sortKey === undefined || sortKey === null) {
        // Get next sort key
        const lastAssortmentLink = (await AssortmentLinks.findOne(
          { parentAssortmentId },
          { sort: { sortKey: -1 } },
        )) || { sortKey: 0 };
        $setOnInsert.sortKey = lastAssortmentLink.sortKey + 1;
      } else {
        $set.sortKey = sortKey;
      }

      const assortmentLink = await AssortmentLinks.findOneAndUpdate(
        {
          ...(assortmentLinkId ? generateDbFilterById(assortmentLinkId) : {}),
          parentAssortmentId,
          childAssortmentId,
        },
        {
          $set,
          $setOnInsert,
        },
        {
          upsert: true,
          returnDocument: 'after',
        },
      );

      await emit('ASSORTMENT_ADD_LINK', { assortmentLink });

      if (!options?.skipInvalidation) {
        await invalidateCache({ assortmentIds: [parentAssortmentId] });
      }

      return assortmentLink;
    },

    // This action is specifically used for the bulk migration scripts in the platform package
    update: async (
      assortmentLinkId: string,
      doc: Partial<AssortmentLink>,
      options?: { skipInvalidation?: boolean },
    ) => {
      const selector = generateDbFilterById(assortmentLinkId);
      const modifier = {
        $set: {
          ...doc,
          updated: new Date(),
        },
      };
      const assortmentLink = await AssortmentLinks.findOneAndUpdate(selector, modifier, {
        returnDocument: 'after',
      });

      if (!options?.skipInvalidation && assortmentLink) {
        await invalidateCache({ assortmentIds: [assortmentLink.childAssortmentId] });
      }
      return assortmentLink;
    },

    delete: async (assortmentLinkId: string, options?: { skipInvalidation?: boolean }) => {
      const selector = generateDbFilterById(assortmentLinkId);
      const assortmentLink = await AssortmentLinks.findOneAndDelete(selector);
      if (!assortmentLink) return null;
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
      selector: mongodb.Filter<AssortmentLink>,
      options?: { skipInvalidation?: boolean },
    ) => {
      const assortmentLinks = await AssortmentLinks.find(selector, {
        projection: {
          _id: 1,
          childAssortmentId: 1,
          parentAssortmentId: 1,
        },
      }).toArray();

      const deletionResult = await AssortmentLinks.deleteMany(selector);
      await Promise.all(
        assortmentLinks.map(async (assortmentLink) =>
          emit('ASSORTMENT_REMOVE_LINK', {
            assortmentLinkId: assortmentLink._id,
          }),
        ),
      );

      if (!options?.skipInvalidation && assortmentLinks.length) {
        await invalidateCache({
          assortmentIds: assortmentLinks.flatMap((link) => [
            link.childAssortmentId,
            link.parentAssortmentId,
          ]),
        });
      }

      return deletionResult.deletedCount;
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
      const changedAssortmentLinkIds = await Promise.all(
        sortKeys.map(async ({ assortmentLinkId, sortKey }) => {
          await AssortmentLinks.updateOne(generateDbFilterById(assortmentLinkId), {
            $set: {
              sortKey: sortKey + 1,
              updated: new Date(),
            },
          });

          return assortmentLinkId;
        }),
      );

      const assortmentLinks = await AssortmentLinks.find({
        _id: { $in: changedAssortmentLinkIds },
      }).toArray();

      if (!options?.skipInvalidation && assortmentLinks.length) {
        await invalidateCache({ assortmentIds: assortmentLinks.map((link) => link.childAssortmentId) });
      }

      await emit('ASSORTMENT_REORDER_LINKS', { assortmentLinks });

      return assortmentLinks;
    },
  };
};

export type AssortmentLinksModule = ReturnType<typeof configureAssortmentLinksModule>;
