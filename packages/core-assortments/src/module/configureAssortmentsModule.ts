import {
  Filter,
  ModuleInput,
  ModuleMutations,
} from '@unchainedshop/types/common';
import {
  AssortmentsModule,
  Assortment,
} from '@unchainedshop/types/assortments';
import { emit, registerEvents } from 'meteor/unchained:director-events';
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

type FindQuery = {
  includeInactive?: boolean;
};
const buildFindSelector = ({ includeInactive = false }: FindQuery) => {
  const selector: { isActive?: true } = {};
  if (!includeInactive) selector.isActive = true;
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

  return {
    // Queries
    findAssortment: async ({ assortmentId }) => {
      return await Assortments.findOne(generateDbFilterById(assortmentId));
    },

    findAssortments: async ({ limit, offset, includeInactive }) => {
      const countries = await Assortments.find(
        buildFindSelector({ includeInactive }),
        {
          skip: offset,
          limit,
        }
      );
      return countries.toArray();
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
    create: async (doc: Assortment, userId?: string) => {
      const assortmentId = await mutations.create(doc, userId);
      emit('COUNTRY_CREATE', { assortmentId });
      return assortmentId;
    },
    update: async (_id: string, doc: Assortment, userId?: string) => {
      const assortmentId = await mutations.update(_id, doc, userId);
      emit('COUNTRY_UPDATE', { assortmentId });
      return assortmentId;
    },
    delete: async (assortmentId) => {
      emit('COUNTRY_REMOVE', { assortmentId });
      return 0;
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
    filters: configureAssortmentFiltersModule({ AssortmentFilters }),
    links: configureAssortmentLinksModule({ AssortmentLinks, invalidateCache }),
    products: configureAssortmentProductsModule({
      AssortmentProducts,
      invalidateCache,
    }),
    texts: configureAssortmentTextsModule({ Assortments, AssortmentTexts }),
  };
};
