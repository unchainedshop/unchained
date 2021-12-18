import { ModuleInput, ModuleMutations } from '@unchainedshop/types/common';
import {
  AssortmentsModule,
  Assortment,
} from '@unchainedshop/types/assortments';
import { emit, registerEvents } from 'meteor/unchained:director-events';
import { generateDbMutations } from 'meteor/unchained:utils';
import { AssortmentsCollection } from '../db/AssortmentsCollection';
import { AssortmentsSchema } from '../db/AssortmentsSchema';

const ASSORTMENT_EVENTS = [
  'ASSORTMENT_CREATE',
  'ASSORTMENT_REMOVE',
  'ASSORTMENT_SET_BASE',
  'ASSORTMENT_UPDATE',
  'ASSORTMENT_UPDATE_TEXTS',
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

  const mutations = generateDbMutations<Assortment>(Assortments, AssortmentsSchema) as ModuleMutations<Assortment>;

  return {
    findAssortment: async ({ countryId, isoCode }) => {
      return await Assortments.findOne(
        countryId ? { _id: countryId } : { isoCode }
      );
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

    countryExists: async ({ countryId }) => {
      const countryCount = await Assortments.find(
        { _id: countryId },
        { limit: 1 }
      ).count();
      return !!countryCount;
    },

    create: async (doc: Assortment, userId?: string) => {
      const countryId = await mutations.create(doc, userId);
      emit('COUNTRY_CREATE', { countryId });
      return countryId;
    },
    update: async (_id: string, doc: Assortment, userId?: string) => {
      const countryId = await mutations.update(_id, doc, userId);
      emit('COUNTRY_UPDATE', { countryId });
      return countryId;
    },
    delete: async (countryId) => {
      const deletedCount = await mutations.delete(countryId);
      emit('COUNTRY_REMOVE', { countryId });
      return deletedCount;
    },

    filters: {},
    links: {},
    products: {},
    texts: {},
  };
};
