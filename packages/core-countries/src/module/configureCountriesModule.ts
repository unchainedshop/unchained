import { mongodb, TimestampFields, ModuleInput } from '@unchainedshop/mongodb';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, buildSortOptions, generateDbObjectId } from '@unchainedshop/mongodb';
import { SortDirection, SortOption } from '@unchainedshop/utils';
import { systemLocale } from '@unchainedshop/utils';
import { CountriesCollection } from '../db/CountriesCollection.js';
import addMigrations from '../migrations/addMigrations.js';

export type Country = {
  _id?: string;
  isoCode: string;
  isActive?: boolean;
  defaultCurrencyCode?: string;
} & TimestampFields;

export type CountryQuery = {
  includeInactive?: boolean;
  queryString?: string;
};
export type CountriesModule = {
  findCountry: (params: { countryId?: string; isoCode?: string }) => Promise<Country>;
  findCountries: (
    params: CountryQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    },
    options?: mongodb.FindOptions,
  ) => Promise<Array<Country>>;
  count: (query: CountryQuery) => Promise<number>;
  countryExists: (params: { countryId: string }) => Promise<boolean>;

  flagEmoji: (country: Country) => string;
  isBase: (country: Country) => boolean;
  name: (country: Country, language: string) => string;

  update: (_id: string, doc: Country) => Promise<string>;
  delete: (_id: string) => Promise<number>;
  create: (doc: Country) => Promise<string | null>;
};

const COUNTRY_EVENTS: string[] = ['COUNTRY_CREATE', 'COUNTRY_UPDATE', 'COUNTRY_REMOVE'];

const buildFindSelector = ({ includeInactive = false, queryString = '' }: CountryQuery) => {
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
      return country.isoCode === systemLocale.region;
    },

    create: async (doc) => {
      await Countries.deleteOne({ isoCode: doc.isoCode.toUpperCase(), deleted: { $ne: null } });
      const { insertedId: countryId } = await Countries.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        ...doc,
        isoCode: doc.isoCode.toUpperCase(),
        isActive: true,
      });
      await emit('COUNTRY_CREATE', { countryId });
      return countryId;
    },

    update: async (countryId, doc) => {
      await Countries.updateOne(generateDbFilterById(countryId), {
        $set: {
          updated: new Date(),
          ...doc,
        },
      });
      await emit('COUNTRY_UPDATE', { countryId });
      return countryId;
    },

    delete: async (countryId) => {
      const { modifiedCount: deletedCount } = await Countries.updateOne(
        generateDbFilterById(countryId),
        {
          $set: {
            deleted: new Date(),
          },
        },
      );
      await emit('COUNTRY_REMOVE', { countryId });
      return deletedCount;
    },
  };
};
