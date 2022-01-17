import {
  AssortmentLink,
  AssortmentsModule,
} from '@unchainedshop/types/assortments';
import { Collection } from '@unchainedshop/types/common';
import { emit, registerEvents } from 'meteor/unchained:events';
import { generateDbFilterById } from 'meteor/unchained:utils';

const ASSORTMENT_LINK_EVENTS = [
  'ASSORTMENT_ADD_LINK',
  'ASSORTMENT_REMOVE_LINK',
  'ASSORTMENT_REORDER_LINKS',
];

export const configureAssortmentLinksModule = ({
  AssortmentLinks,
  invalidateCache,
}: {
  AssortmentLinks: Collection<AssortmentLink>;
  invalidateCache: AssortmentsModule['invalidateCache'];
}): AssortmentsModule['links'] => {
  registerEvents(ASSORTMENT_LINK_EVENTS);

  return {
    // Queries
    findLink: async ({
      assortmentLinkId,
      parentAssortmentId,
      childAssortmentId,
    }) => {
      return await AssortmentLinks.findOne(
        assortmentLinkId
          ? generateDbFilterById(assortmentLinkId)
          : { parentAssortmentId, childAssortmentId }
      );
    },

    findLinks: async ({ assortmentId, parentAssortmentId }, options) => {
      const selector = parentAssortmentId
        ? {
            parentAssortmentId,
          }
        : {
            $or: [
              { parentAssortmentId: assortmentId },
              { childAssortmentId: assortmentId },
            ],
          };

      const links = AssortmentLinks.find(
        selector,
        options || {
          sort: { sortKey: 1 },
        }
      );

      return links.toArray();
    },

    // Mutations
    create: async (doc, options, userId) => {
      const { parentAssortmentId, childAssortmentId, ...rest } = doc;

      const selector = {
        ...(doc._id ? generateDbFilterById(doc._id) : {}),
        parentAssortmentId,
        childAssortmentId,
      };

      const $set: any = {
        updated: new Date(),
        updatedBy: userId,
        ...rest,
      };
      const $setOnInsert: any = {
        parentAssortmentId,
        childAssortmentId,
        created: new Date(),
        createdBy: userId,
      };

      if (!doc.sortKey) {
        // Get next sort key
        const lastAssortmentLink = (await AssortmentLinks.findOne(
          { parentAssortmentId },
          { sort: { sortKey: -1 } }
        )) || { sortKey: 0 };
        $setOnInsert.sortKey = lastAssortmentLink.sortKey + 1;
      } else {
        $set.sortKey = doc.sortKey;
      }

      await AssortmentLinks.updateOne(
        selector,
        {
          $set,
          $setOnInsert,
        },
        {
          upsert: true,
        }
      );

      const assortmentLink = await AssortmentLinks.findOne(selector);

      emit('ASSORTMENT_ADD_LINK', { assortmentLink });

      if (!options.skipInvalidation) {
        invalidateCache({ assortmentIds: [parentAssortmentId] });
      }

      return assortmentLink;
    },

    // This action is specifically used for the bulk migration scripts in the platform package
    update: async (assortmentLinkId, doc) => {
      const selector = generateDbFilterById(assortmentLinkId);
      const modifier = { $set: doc };
      await AssortmentLinks.updateOne(selector, modifier);
      return await AssortmentLinks.findOne(selector);
    },

    delete: async (assortmentLinkId, options) => {
      const selector = generateDbFilterById(assortmentLinkId);

      const assortmentLink = await AssortmentLinks.findOne(selector, {
        projection: { _id: 1, parentAssortmentId: 1 },
      });

      AssortmentLinks.deleteOne(selector);

      emit('ASSORTMENT_REMOVE_LINK', {
        assortmentLinkId: assortmentLink._id,
      });

      if (!options.skipInvalidation) {
        invalidateCache({
          assortmentIds: [assortmentLink.parentAssortmentId],
        });
      }

      return [assortmentLink];
    },

    deleteMany: async (selector, options) => {
      const assortmentLinks = await AssortmentLinks.find(selector, {
        projection: { _id: 1, parentAssortmentId: 1 },
      }).toArray();

      AssortmentLinks.deleteMany(selector);
      assortmentLinks.forEach((assortmentLink) => {
        emit('ASSORTMENT_REMOVE_LINK', {
          assortmentLinkId: assortmentLink._id,
        });
      });

      if (!options.skipInvalidation && assortmentLinks.length) {
        invalidateCache({
          assortmentIds: assortmentLinks.map((link) => link.parentAssortmentId),
        });
      }

      return assortmentLinks;
    },

    updateManualOrder: async ({ sortKeys }, userId) => {
      const changedAssortmentLinkIds = await Promise.all(
        sortKeys.map(async ({ assortmentLinkId, sortKey }) => {
          await AssortmentLinks.updateOne(
            generateDbFilterById(assortmentLinkId),
            {
              $set: {
                sortKey: sortKey + 1,
                updated: new Date(),
                updatedBy: userId,
              },
            }
          );

          return assortmentLinkId;
        })
      );

      const assortmentLinks = await AssortmentLinks.find({
        _id: { $in: changedAssortmentLinkIds },
      }).toArray();

      emit('ASSORTMENT_REORDER_LINKS', { assortmentLinks });

      return assortmentLinks;
    },
  };
};
