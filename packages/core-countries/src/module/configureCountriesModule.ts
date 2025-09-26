import {
  mongodb,
  TimestampFields,
  ModuleInput,
  assertDocumentDBCompatMode,
} from '@unchainedshop/mongodb';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, buildSortOptions, generateDbObjectId } from '@unchainedshop/mongodb';
import { SortDirection, SortOption } from '@unchainedshop/utils';
import { systemLocale } from '@unchainedshop/utils';
import { CountriesCollection } from '../db/CountriesCollection.js';

export type Country = {
  _id?: string;
  isoCode: string;
  isActive?: boolean;
  defaultCurrencyCode?: string;
} & TimestampFields;

export type CountryQuery = mongodb.Filter<Country> & {
  includeInactive?: boolean;
  queryString?: string;
};

const COUNTRY_EVENTS: string[] = ['COUNTRY_CREATE', 'COUNTRY_UPDATE', 'COUNTRY_REMOVE'];

export const buildFindSelector = ({
  includeInactive = false,
  queryString = '',
  ...rest
}: CountryQuery) => {
  const selector: mongodb.Filter<Country> = { ...rest, deleted: null };
  if (!includeInactive) selector.isActive = true;
  if (queryString) {
    assertDocumentDBCompatMode();
    selector.$text = { $search: queryString };
  }
  return selector;
};

export const configureCountriesModule = async ({ db }: ModuleInput<Record<string, never>>) => {
  registerEvents(COUNTRY_EVENTS);

  const Countries = await CountriesCollection(db);

  return {
    count: async (query: CountryQuery): Promise<number> => {
      const countryCount = await Countries.countDocuments(buildFindSelector(query));
      return countryCount;
    },

    findCountry: async (params: { countryId: string } | { isoCode: string }) => {
      if ('countryId' in params) {
        return Countries.findOne(generateDbFilterById(params.countryId));
      } else {
        return Countries.findOne({ isoCode: params.isoCode });
      }
    },

    findCountries: async (
      {
        limit,
        offset,
        sort,
        ...query
      }: CountryQuery & {
        limit?: number;
        offset?: number;
        sort?: SortOption[];
      },
      options?: mongodb.FindOptions,
    ): Promise<Country[]> => {
      const defaultSort = [{ key: 'created', value: SortDirection.ASC }] as SortOption[];
      const countries = Countries.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: buildSortOptions(sort || defaultSort),
        ...options,
      });
      return countries.toArray();
    },

    countryExists: async ({ countryId }: { countryId: string }): Promise<boolean> => {
      const countryCount = await Countries.countDocuments(
        generateDbFilterById(countryId, { deleted: null }),
        {
          limit: 1,
        },
      );
      return !!countryCount;
    },

    name(country: Country, locale: Intl.Locale) {
      return new Intl.DisplayNames([locale], { type: 'region', fallback: 'code' }).of(country.isoCode);
    },

    flagEmoji(country: Country) {
      const letterToLetterEmoji = (letter: string): string => {
        return String.fromCodePoint(letter.toLowerCase().charCodeAt(0) + 127365);
      };
      return Array.from(country.isoCode.toUpperCase()).map(letterToLetterEmoji).join('');
    },

    isBase(country: Country) {
      return country.isoCode === systemLocale.region;
    },

    create: async (
      doc: Omit<Country, '_id' | 'created'> & Pick<Partial<Country>, '_id' | 'created'>,
    ) => {
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

    update: async (countryId: string, doc: Country) => {
      await Countries.updateOne(generateDbFilterById(countryId), {
        $set: {
          updated: new Date(),
          ...doc,
        },
      });
      await emit('COUNTRY_UPDATE', { countryId });
      return countryId;
    },

    delete: async (countryId: string) => {
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

export type CountriesModule = Awaited<ReturnType<typeof configureCountriesModule>>;
