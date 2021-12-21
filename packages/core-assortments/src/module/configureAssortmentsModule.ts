import {
  Filter,
  ModuleInput,
  ModuleMutations,
  Query,
} from '@unchainedshop/types/common';
import {
  AssortmentsModule,
  Assortment,
} from '@unchainedshop/types/assortments';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log, LogLevel } from 'meteor/unchained:logger';
import {
  generateDbMutations,
  generateDbFilterById,
} from 'meteor/unchained:utils';
import { AssortmentsCollection } from '../db/AssortmentsCollection';
import { AssortmentsSchema } from '../db/AssortmentsSchema';
import { configureAssortmentFiltersModule } from './configureAssortmentFiltersModule';
import { configureAssortmentLinksModule } from './configureAssortmentLinksModule';
import { assortmentSettings } from 'src/assortments-settings';
import { configureAssortmentProductsModule } from './configureAssortmentProductsModule';
import { configureAssortmentTextsModule } from './configureAssortmentTextsModule';
import { configureAssortmentMediaModule } from './configureAssortmentMediaModule';

const ASSORTMENT_EVENTS = [
  'ASSORTMENT_CREATE',
  'ASSORTMENT_REMOVE',
  'ASSORTMENT_SET_BASE',
  'ASSORTMENT_UPDATE',
  'ASSORTMENT_REORDER_MEDIA',
  'ASSORTMENT_UPDATE_MEDIA_TEXT',
  'ASSORTMENT_REMOVE_MEDIA',
  'ASSORTMENT_ADD_MEDIA',
];

const buildFindSelector = ({
  slugs = [],
  tags = [],
  includeLeaves = false,
  includeInactive = false,
}) => {
  const selector: Query = {};

  if (slugs?.length > 0) {
    selector.slugs = { $in: slugs };
  } else if (tags?.length > 0) {
    selector.tags = { $all: tags };
  }

  if (!includeLeaves) {
    selector.isRoot = true;
  }
  if (!includeInactive) {
    selector.isActive = true;
  }
  return selector;
};

const eqSet = (as: Set<string>, bs: Set<string>) => {
  return [...as].join(',') === [...bs].join(',');
};

export const configureAssortmentsModule = async ({
  db,
}: ModuleInput): Promise<AssortmentsModule> => {
  registerEvents(ASSORTMENT_EVENTS);

  const {
    Assortments,
    AssortmentTexts,
    AssortmentProducts,
    AssortmentLinks,
    AssortmentFilters,
  } = await AssortmentsCollection(db);

  const mutations = generateDbMutations<Assortment>(
    Assortments,
    AssortmentsSchema
  ) as ModuleMutations<Assortment>;

  const findLinkedAssortments = async (assortment: Assortment) => {
    return await AssortmentLinks.find(
      {
        $or: [
          { parentAssortmentId: assortment._id },
          { childAssortmentId: assortment._id },
        ],
      },
      {
        sort: { sortKey: 1 },
      }
    ).toArray();
  };

  const findProductAssignments = async (assortment: Assortment) => {
    return await AssortmentProducts.find(
      { assortmentId: assortment._id },
      {
        sort: { sortKey: 1 },
      }
    ).toArray();
  };

  // returns AssortmentProducts and child assortment links with products.
  const collectProductIdCacheTree = async (assortment: Assortment) => {
    // get assortment products related with this assortment I.E AssortmentProducts
    const productAssignments = await findProductAssignments(assortment);
    const ownProductIds = productAssignments.map(({ productId }) => productId);

    // get assortment links parent or child linked with this assortment I.E. AssortmentLinks
    const linkedAssortments = await findLinkedAssortments(assortment);

    // filter previous result set to get child assortment links
    const childAssortments = linkedAssortments.filter(
      ({ parentAssortmentId }) => parentAssortmentId === assortment._id
    );

    // perform the whole function recursively for each child
    const productIds = await childAssortments.reduce(
      async (currentProductIdsPromise, { childAssortmentId }) => {
        const currentProductIds = await currentProductIdsPromise;
        const childAssortment = await Assortments.findOne(
          generateDbFilterById(childAssortmentId)
        );

        if (childAssortment) {
          const newProductIds = await collectProductIdCacheTree(
            childAssortment
          );
          return [...currentProductIds, ...newProductIds];
        }
        return currentProductIds;
      },
      Promise.resolve([] as Array<string>)
    );

    return [...ownProductIds, ...productIds];
  };

  const findProductIds = async (
    assortment: Assortment,
    { forceLiveCollection = false, ignoreChildAssortments = false } = {}
  ) => {
    if (ignoreChildAssortments) {
      const productAssignments = await findProductAssignments(assortment);
      return productAssignments.map(({ productId }) => productId);
    }
    // eslint-disable-next-line
    if (!assortment._cachedProductIds || forceLiveCollection) {
      // get array of assortment products and child assortment links to products
      const collectedProductIdTree =
        (await collectProductIdCacheTree(assortment)) || [];
      const assortmentSet = new Set<string>(
        assortmentSettings.zipTree(collectedProductIdTree)
      );
      return [...assortmentSet];
    }
    return assortment._cachedProductIds; // eslint-disable-line
  };

  const invalidateProductIdCache = async (
    assortment: Assortment,
    options: { skipUpstreamTraversal: boolean } = {
      skipUpstreamTraversal: false,
    },
    userId?: string
  ) => {
    const linkedAssortments = await findLinkedAssortments(assortment);
    const productIds = await findProductIds(assortment, {
      forceLiveCollection: true,
    });

    // eslint-disable-next-line
    if (eqSet(new Set(productIds), new Set(assortment._cachedProductIds))) {
      return 0;
    }

    const updatedResult = await Assortments.updateOne(
      generateDbFilterById(assortment._id),
      {
        $set: {
          updated: new Date(),
          updatedBy: userId,
          _cachedProductIds: productIds,
        },
      }
    );

    let updateCount = updatedResult.modifiedCount;

    if (options.skipUpstreamTraversal) return updateCount;

    const filteredLinkedAssortments = linkedAssortments.filter(
      ({ childAssortmentId }) => childAssortmentId === assortment._id
    );

    await Promise.all(
      filteredLinkedAssortments.map(async ({ parentAssortmentId }) => {
        const parent = await Assortments.findOne(
          generateDbFilterById(parentAssortmentId)
        );

        if (parent) {
          updateCount += await invalidateProductIdCache(
            parent,
            options,
            userId
          );
        }
        return true;
      })
    );

    return updateCount;
  };

  const invalidateCache = async (
    selector: Filter<Assortment>,
    userId?: string
  ) => {
    log('Assortments: Start invalidating assortment caches', {
      level: LogLevel.Verbose,
    });

    const assortments = await Assortments.find(selector || {}).toArray();

    assortments.forEach((assortment) => {
      invalidateProductIdCache(
        assortment,
        { skipUpstreamTraversal: true },
        userId
      );
    });
  };

  /*
   * Assortment sub entities
   */

  const assortmentFilters = configureAssortmentFiltersModule({
    AssortmentFilters,
  });
  const assortmentLinks = configureAssortmentLinksModule({
    AssortmentLinks,
    invalidateCache,
  });
  const assortmentProducts = configureAssortmentProductsModule({
    AssortmentProducts,
    invalidateCache,
  });

  const assortmentTexts = configureAssortmentTextsModule({
    Assortments,
    AssortmentTexts,
  });

  /*
   * Assortment
   */

  return {
    // Queries
    findAssortment: async ({ assortmentId, slug, ...rest }) => {
      let selector: Query = {};

      if (assortmentId) {
        selector._id = generateDbFilterById(assortmentId);
      } else if (slug) {
        selector.slugs = slug;
      } else {
        return null;
      }

      return await Assortments.findOne(selector);
    },

    findAssortments: async ({ limit, offset, ...query }) => {
      const countries = Assortments.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: { sequence: 1 },
      });
      return await countries.toArray();
    },

    count: async (query) => {
      const count = await Assortments.find(buildFindSelector(query)).count();
      return count;
    },

    assortmentExists: async ({ assortmentId }) => {
      const assortmentCount = await Assortments.find(
        generateDbFilterById(assortmentId),
        { limit: 1 }
      ).count();
      return !!assortmentCount;
    },

    // Mutations
    create: async (
      {
        authorId,
        isActive = true,
        isBase = false,
        isRoot = false,
        locale,
        meta = {},
        sequence,
        title,
        ...rest
      },
      userId
    ) => {
      const assortmentId = await mutations.create(
        {
          sequence: sequence || (await Assortments.find({}).count()) + 10,
          isBase,
          isActive,
          isRoot,
          meta,
          authorId,
          ...rest,
        },
        userId
      );

      const assortment = Assortments.findOne(
        generateDbFilterById(assortmentId)
      );

      if (locale) {
        assortmentTexts.upsertLocalizedText(
          assortmentId,
          locale,
          { assortmentId, title, authorId, locale },
          userId
        );
      }

      emit('ASSORTMENT_CREATE', { assortment });

      return assortmentId;
    },

    update: async (_id: string, doc: Assortment, userId?: string) => {
      const assortmentId = await mutations.update(_id, doc, userId);
      emit('ASSORTMENT_UPDATE', { assortmentId });
      return assortmentId;
    },

    delete: async (assortmentId, options, userId) => {
      await assortmentLinks.deleteMany(
        {
          $or: [
            { parentAssortmentId: assortmentId },
            { childAssortmentId: assortmentId },
          ],
        },
        { skipInvalidation: true }
      );

      await assortmentProducts.deleteMany(
        { assortmentId },
        { skipInvalidation: true }
      );

      await assortmentFilters.deleteMany({ assortmentId });

      await assortmentTexts.deleteMany(assortmentId, userId);

      const deletedResult = await Assortments.deleteOne(
        generateDbFilterById(assortmentId)
      );

      if (deletedResult.deletedCount === 1 && !options.skipInvalidation) {
        // Invalidate all assortments
        invalidateCache({});
      }

      emit('ASSORTMENT_REMOVE', { assortmentId });

      return deletedResult.deletedCount;
    },

    invalidateCache,
    setBase: async (assortmentId, userId) => {
      await Assortments.updateMany(
        { isBase: true },
        {
          $set: {
            isBase: false,
            updated: new Date(),
            updatedBy: userId,
          },
        }
      );

      await Assortments.updateOne(generateDbFilterById(assortmentId), {
        $set: {
          isBase: true,
          updated: new Date(),
          updatedBy: userId,
        },
      });
      emit('ASSORTMENT_SET_BASE', { assortmentId });
    },

    createBreadcrumbs: () => {},

    // Sub entities
    media: await configureAssortmentMediaModule({ db }),
    filters: assortmentFilters,
    links: assortmentLinks,
    products: assortmentProducts,
    texts: assortmentTexts,
  };
};
