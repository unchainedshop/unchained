import { ModuleInput } from '@unchainedshop/types/common';
import { CountriesModule, Country } from '@unchainedshop/types/countries';
import countryFlags from 'emoji-flags';
import countryI18n from 'i18n-iso-countries';
import { emit, registerEvents } from 'meteor/unchained:events';
import {
  generateDbFilterById,
  generateDbMutations,
  systemLocale,
} from 'meteor/unchained:utils';
import { CountriesCollection } from '../db/CountriesCollection';
import { CountriesSchema } from '../db/CountriesSchema';

const COUNTRY_EVENTS: string[] = [
  'COUNTRY_CREATE',
  'COUNTRY_UPDATE',
  'COUNTRY_REMOVE',
];

type FindQuery = {
  includeInactive?: boolean;
};
const buildFindSelector = ({ includeInactive = false }: FindQuery) => {
  const selector: { isActive?: true } = {};
  if (!includeInactive) selector.isActive = true;
  return selector;
};

export const configureCountriesModule = async ({
  db,
}: ModuleInput): Promise<CountriesModule> => {
  registerEvents(COUNTRY_EVENTS);

  const Countries = await CountriesCollection(db);

  const mutations = generateDbMutations<Country>(Countries, CountriesSchema);

  return {
    count: async (query) => {
      const countryCount = await Countries.find(
        buildFindSelector(query)
      ).count();
      return countryCount;
    },

    findCountry: async ({ countryId, isoCode }) => {
      return await Countries.findOne(
        countryId ? generateDbFilterById(countryId) : { isoCode }
      );
    },

    findCountries: async ({ limit, offset, includeInactive }) => {
      const countries = Countries.find(buildFindSelector({ includeInactive }), {
        skip: offset,
        limit,
      });
      return await countries.toArray();
    },

    countryExists: async ({ countryId }) => {
      const countryCount = await Countries.find(
        generateDbFilterById(countryId),
        { limit: 1 }
      ).count();
      return !!countryCount;
    },

    name(country, language) {
      return countryI18n.getName(country.isoCode, language) || language;
    },
    flagEmoji(country) {
      return countryFlags.countryCode(country.isoCode).emoji || '❌';
    },
    isBase(country) {
      return country.isoCode === systemLocale.country;
    },

    create: async (doc: Country, userId: string) => {
      const countryId = await mutations.create(doc, userId);
      emit('COUNTRY_CREATE', { countryId });
      return countryId;
    },
    update: async (_id: string, doc: Country, userId: string) => {
      const countryId = await mutations.update(_id, doc, userId);
      emit('COUNTRY_UPDATE', { countryId });
      return countryId;
    },
    delete: async (countryId, userId) => {
      const deletedCount = await mutations.delete(countryId, userId);
      emit('COUNTRY_REMOVE', { countryId });
      return deletedCount;
    },
  };
};
