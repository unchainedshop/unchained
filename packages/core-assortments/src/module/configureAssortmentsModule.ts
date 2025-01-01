import { Tree, SortOption, SortDirection } from '@unchainedshop/utils';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateDbFilterById,
  findPreservingIds,
  buildSortOptions,
  mongodb,
  generateDbObjectId,
  ModuleInput,
} from '@unchainedshop/mongodb';
import { createLogger } from '@unchainedshop/logger';
import addMigrations from '../migrations/addMigrations.js';
import {
  Assortment,
  AssortmentLink,
  AssortmentProduct,
  AssortmentQuery,
  AssortmentsCollection,
  InvalidateCacheFn,
} from '../db/AssortmentsCollection.js';
import { configureAssortmentFiltersModule } from './configureAssortmentFiltersModule.js';
import { configureAssortmentLinksModule } from './configureAssortmentLinksModule.js';
import { assortmentsSettings, AssortmentsSettingsOptions } from '../assortments-settings.js';
import { configureAssortmentProductsModule } from './configureAssortmentProductsModule.js';
import { configureAssortmentTextsModule } from './configureAssortmentTextsModule.js';
import { configureAssortmentMediaModule } from './configureAssortmentMediaModule.js';
import { makeAssortmentBreadcrumbsBuilder } from '../utils/breadcrumbs/makeAssortmentBreadcrumbsBuilder.js';

export interface AssortmentPathLink {
  assortmentId: string;
  childAssortmentId: string;
  parentIds: string[];
}

export type BreadcrumbAssortmentLinkFunction = (
  childAssortmentId: string,
) => Promise<Array<AssortmentLink>>;

export type BreacrumbAssortmentProductFunction = (
  productId: string,
) => Promise<Array<AssortmentProduct>>;

const logger = createLogger('unchained:core');

const ASSORTMENT_EVENTS = [
  'ASSORTMENT_CREATE',
  'ASSORTMENT_REMOVE',
  'ASSORTMENT_SET_BASE',
  'ASSORTMENT_UPDATE',
];

export const buildFindSelector = ({
  assortmentIds,
  assortmentSelector,
  slugs,
  tags,
  includeLeaves = false,
  includeInactive = false,
  queryString,
}: AssortmentQuery) => {
  const selector: mongodb.Filter<Assortment> = assortmentSelector || {};
  selector.deleted = null;

  if (assortmentIds) {
    selector._id = { $in: assortmentIds };
  }

  if (slugs) {
    selector.slugs = { $in: slugs };
  }

  if (tags) {
    if (Array.isArray(tags)) {
      selector.tags = { $all: tags };
    } else {
      selector.tags = tags;
    }
  }

  if (!assortmentSelector && !includeLeaves) {
    selector.isRoot = true;
  }

  if (queryString) {
    (selector as any).$text = { $search: queryString };
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
}: ModuleInput<AssortmentsSettingsOptions>) => {
  // Events
  registerEvents(ASSORTMENT_EVENTS);

  // Settings
  await assortmentsSettings.configureSettings(assortmentOptions, db);

  // Migration
  addMigrations(migrationRepository);

  // Collections & Mutations
  const { Assortments, AssortmentTexts, AssortmentProducts, AssortmentLinks, AssortmentFilters } =
    await AssortmentsCollection(db);

  // Functions
  const findLinkedAssortments = async (assortment: Assortment): Promise<Array<AssortmentLink>> => {
    return AssortmentLinks.find(
      {
        $or: [{ parentAssortmentId: assortment._id }, { childAssortmentId: assortment._id }],
      },
      {
        sort: { sortKey: 1 },
      },
    ).toArray();
  };

  const findProductAssignments = async (assortmentId: string) => {
    return AssortmentProducts.find(
      { assortmentId },
      {
        sort: { sortKey: 1 },
      },
    ).toArray();
  };

  // returns AssortmentProducts and child assortment links with products.
  const collectProductIdCacheTree = async (assortment: Assortment): Promise<Tree<string>> => {
    // get assortment products related with this assortment I.E AssortmentProducts
    const productAssignments = await findProductAssignments(assortment._id);
    const ownProductIds = productAssignments.map(({ productId }) => productId);

    // get assortment links parent or child linked with this assortment I.E. AssortmentLinks
    const linkedAssortments = await findLinkedAssortments(assortment);

    // filter previous result set to get child assortment links
    const childAssortments = linkedAssortments.filter(
      ({ parentAssortmentId }) => parentAssortmentId === assortment._id,
    );

    // perform the whole function recursively for each child
    const productIds = await Promise.all(
      childAssortments.map(async ({ childAssortmentId }) => {
        const childAssortment = await Assortments.findOne(
          generateDbFilterById(childAssortmentId, { isActive: true, deleted: null }),
          {},
        );

        if (childAssortment) {
          return collectProductIdCacheTree(childAssortment);
        }
        return [];
      }),
    );

    return [...ownProductIds, ...productIds];
  };

  const buildProductIds = async (assortment: Assortment) => {
    const collectedProductIdTree = (await collectProductIdCacheTree(assortment)) || [];
    const assortmentSet = new Set<string>(assortmentsSettings.zipTree(collectedProductIdTree));
    return [...assortmentSet];
  };

  const invalidateProductIdCache = async (
    assortment: Assortment,
    cacheOptions: { skipUpstreamTraversal: boolean } = {
      skipUpstreamTraversal: false,
    },
  ) => {
    const productIds = await buildProductIds(assortment);

    let updateCount = await assortmentsSettings.setCachedProductIds(assortment._id, productIds);

    if (cacheOptions.skipUpstreamTraversal || updateCount === 0) return updateCount;

    const linkedAssortments = await findLinkedAssortments(assortment);

    const filteredLinkedAssortments = linkedAssortments.filter(
      ({ childAssortmentId }) => childAssortmentId === assortment._id,
    );

    await Promise.all(
      filteredLinkedAssortments.map(async ({ parentAssortmentId }) => {
        const parent = await Assortments.findOne(
          generateDbFilterById(parentAssortmentId, {
            isActive: true,
            deleted: null,
          }),
        );

        if (parent) {
          updateCount += await invalidateProductIdCache(parent, cacheOptions);
        }
        return true;
      }),
    );

    return updateCount;
  };

  const invalidateCache: InvalidateCacheFn = async (selector, options) => {
    logger.debug('Invalidating productId cache for assortments');

    const assortments = await Assortments.find(
      buildFindSelector({ includeInactive: true, includeLeaves: true, ...selector }),
    ).toArray();

    // Process serially to reduce load
    const totalInvalidatedAssortments = await assortments.reduce(async (acc, assortment) => {
      const total = await acc;
      const invalidatedAssortments = await invalidateProductIdCache(assortment, options);
      return total + invalidatedAssortments;
    }, Promise.resolve(0));

    logger.debug(
      `Invalidated productId cache for ${totalInvalidatedAssortments} of ${assortments.length} base assortments`,
    );
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
  const assortmentMedia = await configureAssortmentMediaModule({ db });

  /*
   * Assortment Module
   */

  return {
    findAssortment: async ({
      assortmentId,
      slug,
    }: {
      assortmentId?: string;
      slug?: string;
    }): Promise<Assortment> => {
      let selector: mongodb.Filter<Assortment> = {};

      if (assortmentId) {
        selector = generateDbFilterById(assortmentId);
      } else if (slug) {
        selector.slugs = slug;
      } else {
        return null;
      }

      return Assortments.findOne(selector, {});
    },

    findAssortments: async ({
      limit,
      offset,
      sort,
      ...query
    }: AssortmentQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    }): Promise<Array<Assortment>> => {
      const defaultSortOption: Array<SortOption> = [{ key: 'sequence', value: SortDirection.ASC }];
      const assortments = Assortments.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: buildSortOptions(sort || defaultSortOption),
      });
      return assortments.toArray();
    },

    findProductIds: async ({
      assortmentId,
      forceLiveCollection,
      ignoreChildAssortments,
    }: {
      assortmentId: string;
      forceLiveCollection?: boolean;
      ignoreChildAssortments?: boolean;
    }): Promise<Array<string>> => {
      const assortment = await Assortments.findOne(generateDbFilterById(assortmentId), {});
      if (!assortment) return [];

      if (ignoreChildAssortments) {
        const productAssignments = await findProductAssignments(assortment._id);
        return productAssignments.map(({ productId }) => productId);
      }
      if (!forceLiveCollection) {
        const cachedProductIds = await assortmentsSettings.getCachedProductIds(assortment._id);
        if (cachedProductIds) return cachedProductIds;
      }
      return buildProductIds(assortment);
    },

    children: async ({
      assortmentId,
      includeInactive,
    }: {
      assortmentId: string;
      includeInactive?: boolean;
    }): Promise<Array<Assortment>> => {
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

    count: async (query: AssortmentQuery): Promise<number> =>
      Assortments.countDocuments(buildFindSelector(query)),

    assortmentExists: async ({
      assortmentId,
    }: {
      assortmentId?: string;
      slug?: string;
    }): Promise<boolean> => {
      const assortmentCount = await Assortments.countDocuments(
        generateDbFilterById(assortmentId, { deleted: null }),
        {
          limit: 1,
        },
      );
      return !!assortmentCount;
    },

    breadcrumbs: async (
      params: {
        assortmentId?: string;
        productId?: string;
      },
      {
        resolveAssortmentLinks,
        resolveAssortmentProducts,
      }: {
        resolveAssortmentLinks: BreadcrumbAssortmentLinkFunction;
        resolveAssortmentProducts: BreacrumbAssortmentProductFunction;
      },
    ): Promise<Array<{ links: Array<AssortmentPathLink> }>> => {
      const buildBreadcrumbs = makeAssortmentBreadcrumbsBuilder({
        resolveAssortmentLinks,
        resolveAssortmentProducts,
      });

      return buildBreadcrumbs(params);
    },

    // Mutations
    create: async ({
      _id,
      isActive = true,
      isBase = false,
      isRoot = false,
      meta = {},
      sequence,
      ...rest
    }: Assortment): Promise<Assortment> => {
      if (_id) await Assortments.deleteOne({ _id, deleted: { $ne: null } });
      const { insertedId: assortmentId } = await Assortments.insertOne({
        _id: _id || generateDbObjectId(),
        created: new Date(),
        sequence: sequence || (await Assortments.countDocuments({})) + 10,
        isBase,
        isActive,
        isRoot,
        meta,
        ...rest,
      });
      const assortment = await Assortments.findOne(generateDbFilterById(assortmentId));
      await emit('ASSORTMENT_CREATE', { assortment });

      return assortment;
    },

    update: async (
      assortmentId: string,
      doc: Assortment,
      options?: { skipInvalidation?: boolean },
    ): Promise<string> => {
      await Assortments.updateOne(generateDbFilterById(assortmentId), {
        $set: {
          updated: new Date(),
          ...doc,
        },
      });
      await emit('ASSORTMENT_UPDATE', { assortmentId });

      if (!options?.skipInvalidation) {
        await invalidateCache({ assortmentIds: [assortmentId] });
      }
      return assortmentId;
    },

    delete: async (assortmentId: string, options?: { skipInvalidation?: boolean }): Promise<number> => {
      await assortmentLinks.deleteMany(
        {
          $or: [{ parentAssortmentId: assortmentId }, { childAssortmentId: assortmentId }],
        },
        { skipInvalidation: true },
      );

      await assortmentProducts.deleteMany({ assortmentId }, { skipInvalidation: true });
      await assortmentFilters.deleteMany({ assortmentId });
      await assortmentTexts.deleteMany({ assortmentId });
      await assortmentMedia.deleteMediaFiles({ assortmentId });

      const { modifiedCount: deletedCount } = await Assortments.updateOne(
        generateDbFilterById(assortmentId),
        {
          $set: {
            deleted: new Date(),
          },
        },
      );

      if (deletedCount === 1 && !options?.skipInvalidation) {
        // Invalidate all assortments
        await invalidateCache({}, { skipUpstreamTraversal: true });
      }

      await emit('ASSORTMENT_REMOVE', { assortmentId });

      return deletedCount;
    },

    invalidateCache,
    setBase: async (assortmentId: string): Promise<void> => {
      await Assortments.updateMany(
        { isBase: true },
        {
          $set: {
            isBase: false,
            updated: new Date(),
          },
        },
      );

      await Assortments.updateOne(generateDbFilterById(assortmentId), {
        $set: {
          isBase: true,
          updated: new Date(),
        },
      });
      await emit('ASSORTMENT_SET_BASE', { assortmentId });
    },

    search: {
      findFilteredAssortments: async ({
        limit,
        offset,
        assortmentIds,
        assortmentSelector,
        sort,
      }: {
        assortmentIds: Array<string>;
        assortmentSelector: mongodb.Filter<Assortment>;
        limit: number;
        offset: number;
        sort: mongodb.FindOptions['sort'];
      }): Promise<Array<Assortment>> => {
        const assortments = await findPreservingIds(Assortments)(assortmentSelector, assortmentIds, {
          limit,
          skip: offset,
          sort,
        });

        return assortments;
      },
    },

    // Sub entities
    media: assortmentMedia,
    filters: assortmentFilters,
    links: assortmentLinks,
    products: assortmentProducts,
    texts: assortmentTexts,
  };
};

export type AssortmentsModule = Awaited<ReturnType<typeof configureAssortmentsModule>>;
