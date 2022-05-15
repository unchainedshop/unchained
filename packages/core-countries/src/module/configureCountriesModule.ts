import { ModuleInput, ModuleMutations } from '@unchainedshop/types/common';
import { CountriesModule, Country, CountryQuery } from '@unchainedshop/types/countries';
import countryFlags from 'emoji-flags';
import countryI18n from 'i18n-iso-countries';
import { emit, registerEvents } from 'meteor/unchained:events';
import { generateDbFilterById, generateDbMutations, systemLocale } from 'meteor/unchained:utils';
import { CountriesCollection } from '../db/CountriesCollection';
import { CountriesSchema } from '../db/CountriesSchema';

const COUNTRY_EVENTS: string[] = ['COUNTRY_CREATE', 'COUNTRY_UPDATE', 'COUNTRY_REMOVE'];

const buildFindSelector = ({ includeInactive = false, queryString = '' }: CountryQuery) => {
  const selector: { isActive?: true; $text?: any; deleted?: Date } = { deleted: null };
  if (!includeInactive) selector.isActive = true;
  if (queryString) selector.$text = { $search: queryString };
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
      const countryCount = await Countries.countDocuments(buildFindSelector(query));
      return countryCount;
    },

    findCountry: async ({ countryId, isoCode }) => {
      return Countries.findOne(countryId ? generateDbFilterById(countryId) : { isoCode });
    },

    findCountries: async ({ limit, offset, includeInactive, queryString }, options) => {
      const countries = Countries.find(buildFindSelector({ includeInactive, queryString }), {
        skip: offset,
        limit,
        ...options,
      });
      return countries.toArray();
    },

    countryExists: async ({ countryId }) => {
      const countryCount = await Countries.countDocuments(
        generateDbFilterById(countryId, { deleted: null }),
        {
          limit: 1,
        },
      );
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
