import { ModuleInput, ModuleMutations } from '@unchainedshop/types/common';
import { CountriesModule, Country } from '@unchainedshop/types/countries';
import countryFlags from 'emoji-flags';
import countryI18n from 'i18n-iso-countries';
import { emit, registerEvents } from 'meteor/unchained:events';
import { generateDbFilterById, generateDbMutations, systemLocale } from 'meteor/unchained:utils';
import { CountriesCollection } from '../db/CountriesCollection';
import { CountriesSchema } from '../db/CountriesSchema';

const COUNTRY_EVENTS: string[] = ['COUNTRY_CREATE', 'COUNTRY_UPDATE', 'COUNTRY_REMOVE'];

type FindQuery = {
  includeInactive?: boolean;
};
const buildFindSelector = ({ includeInactive = false }: FindQuery) => {
  const selector: { isActive?: true } = { deleted: null };
  if (!includeInactive) selector.isActive = true;
  return selector;
};

export const configureCountriesModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<CountriesModule> => {
  registerEvents(COUNTRY_EVENTS);

  const Countries = await CountriesCollection(db);

  const mutations = generateDbMutations<Country>(Countries, CountriesSchema) as ModuleMutations<Country>;

  return {
    count: async (query) => {
      const countryCount = await Countries.find(buildFindSelector(query)).count();
      return countryCount;
    },

    findCountry: async ({ countryId, isoCode }) => {
      return Countries.findOne(countryId ? generateDbFilterById(countryId) : { isoCode });
    },

    findCountries: async ({ limit, offset, includeInactive }, options) => {
      const countries = Countries.find(buildFindSelector({ includeInactive }), {
        skip: offset,
        limit,
        ...options,
      });
      return countries.toArray();
    },

    countryExists: async ({ countryId }) => {
      const countryCount = await Countries.find(generateDbFilterById(countryId, { deleted: null }), {
        limit: 1,
      }).count();
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
      await Countries.deleteOne({ isoCode: doc.isoCode.toUpperCase(), deleted: { $ne: null } });
      const countryId = await mutations.create(
        {
          ...doc,
          isoCode: doc.isoCode.toUpperCase(),
          isActive: true,
        },
        userId,
      );
      emit('COUNTRY_CREATE', { countryId });
      return countryId;
    },
    update: async (_id: string, doc: Partial<Country>, userId: string) => {
      const countryId = await mutations.update(_id, { $set: doc }, userId);
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
