import { ModuleInput, ModuleMutations, Query } from '@unchainedshop/types/common';
import {
  AssortmentsModule,
  Assortment,
  AssortmentQuery,
  AssortmentsSettingsOptions,
} from '@unchainedshop/types/assortments';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log, LogLevel } from 'meteor/unchained:logger';
import { generateDbMutations, generateDbFilterById, findPreservingIds } from 'meteor/unchained:utils';
import { resolveAssortmentProductFromDatabase } from '../utils/breadcrumbs/resolveAssortmentProductFromDatabase';
import { resolveAssortmentLinkFromDatabase } from '../utils/breadcrumbs/resolveAssortmentLinkFromDatabase';
import { addMigrations } from '../migrations/addMigrations';
import { AssortmentsCollection } from '../db/AssortmentsCollection';
import { AssortmentsSchema } from '../db/AssortmentsSchema';
import { configureAssortmentFiltersModule } from './configureAssortmentFiltersModule';
import { configureAssortmentLinksModule } from './configureAssortmentLinksModule';
import { assortmentsSettings } from '../assortments-settings';
import { configureAssortmentProductsModule } from './configureAssortmentProductsModule';
import { configureAssortmentTextsModule } from './configureAssortmentTextsModule';
import { configureAssortmentMediaModule } from './configureAssortmentMediaModule';
import { makeAssortmentBreadcrumbsBuilder } from '../utils/breadcrumbs/makeAssortmentBreadcrumbsBuilder';

const ASSORTMENT_EVENTS = [
  'ASSORTMENT_CREATE',
  'ASSORTMENT_REMOVE',
  'ASSORTMENT_SET_BASE',
  'ASSORTMENT_UPDATE',
];

const buildFindSelector = ({
  assortmentIds = [],
  assortmentSelector,
  slugs = [],
  tags = [],
  includeLeaves = false,
  includeInactive = false,
}: AssortmentQuery) => {
  const selector: Query = assortmentSelector || {};

  if (assortmentIds?.length > 0) {
    selector._id = { $in: assortmentIds };
  }

  if (slugs?.length > 0) {
    selector.slugs = { $in: slugs };
  } else if (tags?.length > 0) {
    selector.tags = { $all: tags };
  }

  if (!assortmentSelector && !includeLeaves) {
    selector.isRoot = true;
  }

  if (!assortmentSelector && !includeInactive) {
    selector.isActive = true;
  }
  return selector;
};

export const configureAssortmentsModule = async ({
  db,
  migrationRepository,
  options: assortmentOptions = {},
}: ModuleInput<AssortmentsSettingsOptions>): Promise<AssortmentsModule> => {
  // Events
  registerEvents(ASSORTMENT_EVENTS);

  // Settings
  await assortmentsSettings.configureSettings(assortmentOptions, db);

  // Migration
  addMigrations(migrationRepository);

  // Collections & Mutations
  const { Assortments, AssortmentTexts, AssortmentProducts, AssortmentLinks, AssortmentFilters } =
    await AssortmentsCollection(db);

  const mutations = generateDbMutations<Assortment>(
    Assortments,
    AssortmentsSchema,
  ) as ModuleMutations<Assortment>;

  // Functions
  const findLinkedAssortments = async (assortment: Assortment) => {
    return AssortmentLinks.find(
      {
        $or: [{ parentAssortmentId: assortment._id }, { childAssortmentId: assortment._id }],
      },
      {
        sort: { sortKey: 1 },
      },
    ).toArray();
  };

  const findProductAssignments = async (assortment: Assortment) => {
    return AssortmentProducts.find(
      { assortmentId: assortment._id },
      {
        sort: { sortKey: 1 },
      },
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
      ({ parentAssortmentId }) => parentAssortmentId === assortment._id,
    );

    // perform the whole function recursively for each child
    const productIds = await childAssortments.reduce(
      async (currentProductIdsPromise, { childAssortmentId }) => {
        const currentProductIds = await currentProductIdsPromise;
        const childAssortment = await Assortments.findOne(
          generateDbFilterById(childAssortmentId, { isActive: true }),
          {},
        );

        if (childAssortment) {
          const newProductIds = await collectProductIdCacheTree(childAssortment);
          return [...currentProductIds, ...newProductIds];
        }
        return currentProductIds;
      },
      Promise.resolve([] as Array<string>),
    );

    return [...ownProductIds, ...productIds];
  };

  const buildProductIds = async (assortment: Assortment) => {
    const collectedProductIdTree = (await collectProductIdCacheTree(assortment)) || [];
    const assortmentSet = new Set<string>(assortmentsSettings.zipTree(collectedProductIdTree));
    return [...assortmentSet];
  };

  const findProductIds = async (
    assortment: Assortment,
    { forceLiveCollection = false, ignoreChildAssortments = false } = {},
  ) => {
    if (ignoreChildAssortments) {
      const productAssignments = await findProductAssignments(assortment);
      return productAssignments.map(({ productId }) => productId);
    }
    if (!forceLiveCollection) {
      const cachedProductIds = await assortmentsSettings.getCachedProductIds(assortment._id);
      if (cachedProductIds) return cachedProductIds;
    }
    return buildProductIds(assortment);
  };

  const invalidateProductIdCache = async (
    assortment: Assortment,
    cacheOptions: { skipUpstreamTraversal: boolean } = {
      skipUpstreamTraversal: false,
    },
  ) => {
    const productIds = await buildProductIds(assortment);

    let updateCount = await assortmentsSettings.setCachedProductIds(assortment._id, productIds);

    if (cacheOptions.skipUpstreamTraversal) return updateCount;

    const linkedAssortments = await findLinkedAssortments(assortment);

    const filteredLinkedAssortments = linkedAssortments.filter(
      ({ childAssortmentId }) => childAssortmentId === assortment._id,
    );

    await Promise.all(
      filteredLinkedAssortments.map(async ({ parentAssortmentId }) => {
        const parent = await Assortments.findOne(generateDbFilterById(parentAssortmentId), {});

        if (parent) {
          updateCount += await invalidateProductIdCache(parent, cacheOptions);
        }
        return true;
      }),
    );

    return updateCount;
  };

  const invalidateCache: AssortmentsModule['invalidateCache'] = async (selector, options) => {
    log('Assortments: Start invalidating assortment caches', {
      level: LogLevel.Verbose,
    });

    const assortments = await Assortments.find(
      buildFindSelector({ includeInactive: true, includeLeaves: true, ...selector }),
    ).toArray();

    assortments.forEach((assortment) => {
      invalidateProductIdCache(assortment, {
        skipUpstreamTraversal: options?.skipUpstreamTraversal ?? true,
      });
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
   * Assortment Module
   */

  return {
    // Queries
    findAssortment: async ({ assortmentId, slug }) => {
      let selector: Query = {};

      if (assortmentId) {
        selector = generateDbFilterById(assortmentId);
      } else if (slug) {
        selector.slugs = slug;
      } else {
        return null;
      }

      return Assortments.findOne(selector, {});
    },

    findAssortments: async ({ limit, offset, ...query }) => {
      const assortments = Assortments.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: { sequence: 1 },
      });
      return assortments.toArray();
    },

    findProductIds: async ({ assortmentId, forceLiveCollection, ignoreChildAssortments }) => {
      const assortment = await Assortments.findOne(generateDbFilterById(assortmentId), {});
      return findProductIds(assortment, {
        forceLiveCollection,
        ignoreChildAssortments,
      });
    },

    children: async ({ assortmentId, includeInactive }) => {
      const links = await AssortmentLinks.find(
        { parentAssortmentId: assortmentId },
        {
          projection: { childAssortmentId: 1 },
          sort: { sortKey: 1 },
        },
      ).toArray();

      const assortmentIds = links.map(({ childAssortmentId }) => childAssortmentId);

      const selector = !includeInactive ? { isActive: true } : {};
      return findPreservingIds(Assortments)(selector, assortmentIds);
    },

    count: async (query) => Assortments.find(buildFindSelector(query)).count(),

    assortmentExists: async ({ assortmentId }) => {
      const assortmentCount = await Assortments.find(generateDbFilterById(assortmentId), {
        limit: 1,
      }).count();
      return !!assortmentCount;
    },

    breadcrumbs: async (params) => {
      const resolveAssortmentLink = resolveAssortmentLinkFromDatabase(AssortmentLinks);
      const resolveAssortmentProducts = resolveAssortmentProductFromDatabase(AssortmentProducts);

      const buildBreadcrumbs = makeAssortmentBreadcrumbsBuilder({
        resolveAssortmentLink,
        resolveAssortmentProducts,
      });

      return buildBreadcrumbs(params);
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
      userId,
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
        userId,
      );

      const assortment = Assortments.findOne(generateDbFilterById(assortmentId));

      if (locale) {
        await assortmentTexts.upsertLocalizedText(
          assortmentId,
          locale,
          { assortmentId, title, authorId, locale },
          userId,
        );
      }

      emit('ASSORTMENT_CREATE', { assortment });
      return assortmentId;
    },

    update: async (_id, doc, userId, options) => {
      const assortmentId = await mutations.update(_id, doc, userId);
      emit('ASSORTMENT_UPDATE', { assortmentId });

      if (!options?.skipInvalidation) {
        const assortment = await Assortments.findOne({ _id: assortmentId });
        invalidateProductIdCache(assortment, { skipUpstreamTraversal: false });
      }
      return assortmentId;
    },

    delete: async (assortmentId, options, userId) => {
      await assortmentLinks.deleteMany(
        {
          $or: [{ parentAssortmentId: assortmentId }, { childAssortmentId: assortmentId }],
        },
        { skipInvalidation: true },
        userId,
      );

      await assortmentProducts.deleteMany({ assortmentId }, { skipInvalidation: true }, userId);

      await assortmentFilters.deleteMany({ assortmentId }, userId);

      await assortmentTexts.deleteMany({ assortmentId }, userId);

      const deletedResult = await Assortments.deleteOne(generateDbFilterById(assortmentId));

      if (deletedResult.deletedCount === 1 && !options?.skipInvalidation) {
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
        },
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

    search: {
      findFilteredAssortments: async ({ limit, offset, assortmentIds, assortmentSelector, sort }) => {
        const assortments = await findPreservingIds(Assortments)(assortmentSelector, assortmentIds, {
          limit,
          skip: offset,
          sort,
        });

        return assortments;
      },
    },

    // Sub entities
    media: await configureAssortmentMediaModule({ db }),
    filters: assortmentFilters,
    links: assortmentLinks,
    products: assortmentProducts,
    texts: assortmentTexts,
  };
};
