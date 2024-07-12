import { ModuleInput, ModuleMutations } from '@unchainedshop/types/core.js';
import { CountriesModule, Country, CountryQuery } from '@unchainedshop/types/countries.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbMutations, buildSortOptions } from '@unchainedshop/mongodb';
import { SortDirection, SortOption } from '@unchainedshop/types/api.js';
import { systemLocale } from '@unchainedshop/utils';
import { CountriesCollection } from '../db/CountriesCollection.js';
import { CountriesSchema } from '../db/CountriesSchema.js';
import addMigrations from '../migrations/addMigrations.js';

const COUNTRY_EVENTS: string[] = ['COUNTRY_CREATE', 'COUNTRY_UPDATE', 'COUNTRY_REMOVE'];

export const buildFindSelector = ({ includeInactive = false, queryString = '' }: CountryQuery) => {
  const selector: { isActive?: true; $text?: any; deleted?: Date } = { deleted: null };
  if (!includeInactive) selector.isActive = true;
  if (queryString) selector.$text = { $search: queryString };
  return selector;
};

export const configureCountriesModule = async ({
  db,
  migrationRepository,
}: ModuleInput<Record<string, never>>): Promise<CountriesModule> => {
  registerEvents(COUNTRY_EVENTS);

  // Migration
  addMigrations(migrationRepository);

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

    findCountries: async ({ limit, offset, sort, includeInactive, queryString }, options) => {
      const defaultSort = [{ key: 'created', value: SortDirection.ASC }] as SortOption[];
      const countries = Countries.find(buildFindSelector({ includeInactive, queryString }), {
        skip: offset,
        limit,
        sort: buildSortOptions(sort || defaultSort),
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
      return new Intl.DisplayNames([language], { type: 'region', fallback: 'code' }).of(country.isoCode);
    },
    flagEmoji(country) {
      const letterToLetterEmoji = (letter: string): string => {
        return String.fromCodePoint(letter.toLowerCase().charCodeAt(0) + 127365);
      };
      return Array.from(country.isoCode.toUpperCase()).map(letterToLetterEmoji).join('');
    },

    isBase(country) {
      return country.isoCode === systemLocale.country;
    },
    create: async (doc: Country) => {
      await Countries.deleteOne({ isoCode: doc.isoCode.toUpperCase(), deleted: { $ne: null } });
      const countryId = await mutations.create({
        ...doc,
        isoCode: doc.isoCode.toUpperCase(),
        isActive: true,
      });
      await emit('COUNTRY_CREATE', { countryId });
      return countryId;
    },
    update: async (_id: string, doc: Partial<Country>) => {
      const countryId = await mutations.update(_id, { $set: doc });
      await emit('COUNTRY_UPDATE', { countryId });
      return countryId;
    },
    delete: async (countryId) => {
      const deletedCount = await mutations.delete(countryId);
      await emit('COUNTRY_REMOVE', { countryId });
      return deletedCount;
    },

    deletePermanently: mutations.deletePermanently,
  };
};
