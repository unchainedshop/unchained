import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateDbFilterById,
  buildSortOptions,
  generateDbObjectId,
  type ModuleInput,
  mongodb,
} from '@unchainedshop/mongodb';
import {
  currencyDecimals,
  isoCurrencyDecimals,
  memoizeWithTTL,
  SortDirection,
  type SortOption,
} from '@unchainedshop/utils';
import { CurrenciesCollection, type Currency, type CurrencyQuery } from '../db/CurrenciesCollection.ts';

const CURRENCY_EVENTS: string[] = ['CURRENCY_CREATE', 'CURRENCY_UPDATE', 'CURRENCY_REMOVE'];

const assertValidDecimals = (decimals: number) => {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new Error(`Currency decimals must be an integer from 0 to 18, got ${decimals}`, {
      cause: 'CURRENCY_DECIMALS_INVALID',
    });
  }
};

export const buildFindSelector = ({
  includeInactive = false,
  contractAddress,
  queryString,
  isoCodes,
}: CurrencyQuery) => {
  const selector: mongodb.Filter<Currency> = {
    deleted: null,
  };
  if (!includeInactive) selector.isActive = true;
  if (contractAddress) selector.contractAddress = contractAddress;
  if (isoCodes) {
    selector.isoCode = { $in: isoCodes };
  }
  if (queryString) {
    selector.$text = { $search: queryString };
  }
  return selector;
};

export const configureCurrenciesModule = async ({ db }: ModuleInput<Record<string, never>>) => {
  registerEvents(CURRENCY_EVENTS);

  const Currencies = await CurrenciesCollection(db);

  const allCurrencies = memoizeWithTTL(
    async () => Currencies.find({}, { sort: { created: 1, _id: 1 } }).toArray(),
    { ttl: process.env.NODE_ENV === 'production' ? 60000 : 1 },
  );

  return {
    allCurrencies,

    findCachedCurrency: async (isoCode: string) => {
      const code = isoCode.toUpperCase();
      return (await allCurrencies()).find((currency) => currency.isoCode === code);
    },

    findCurrency: async (
      params:
        | {
            isoCode: string;
          }
        | { currencyId: string },
    ) => {
      if ('currencyId' in params) {
        return Currencies.findOne(generateDbFilterById(params.currencyId));
      } else {
        return Currencies.findOne({ isoCode: params.isoCode });
      }
    },

    findCurrencies: async ({
      limit,
      offset,
      sort,
      ...query
    }: CurrencyQuery & {
      limit?: number;
      offset?: number;
      sort?: SortOption[];
    }): Promise<Currency[]> => {
      const defaultSort = [{ key: 'created', value: SortDirection.ASC }] as SortOption[];
      const currencies = Currencies.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: buildSortOptions(sort || defaultSort),
      });
      return currencies.toArray();
    },

    count: async (query: CurrencyQuery) => {
      const count = await Currencies.countDocuments(buildFindSelector(query));
      return count;
    },

    currencyExists: async ({ currencyId }: { currencyId: string }) => {
      const currencyCount = await Currencies.countDocuments(
        generateDbFilterById(currencyId, { deleted: null }),
        {
          limit: 1,
        },
      );
      return !!currencyCount;
    },

    create: async (
      doc: Omit<Currency, '_id' | 'created'> & Pick<Partial<Currency>, '_id' | 'created'>,
    ) => {
      const isoCode = doc.isoCode.toUpperCase();
      const decimals = doc.decimals ?? isoCurrencyDecimals(isoCode);
      if (decimals === undefined) {
        throw new Error(`${isoCode} is not an ISO 4217 currency, set its decimals`, {
          cause: 'CURRENCY_DECIMALS_REQUIRED',
        });
      }
      assertValidDecimals(decimals);
      await Currencies.deleteOne({ isoCode, deleted: { $ne: null } });
      const { insertedId: currencyId } = await Currencies.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        ...doc,
        isoCode,
        decimals,
        isActive: true,
      });
      allCurrencies.clear();
      await emit('CURRENCY_CREATE', { currencyId });
      return currencyId;
    },

    update: async (currencyId: string, { decimals, ...doc }: Partial<Currency>) => {
      if (doc.isoCode) {
        doc.isoCode = doc.isoCode.toUpperCase();
      }
      if (decimals !== undefined && decimals !== null) {
        assertValidDecimals(decimals);
        const currency = await Currencies.findOne(generateDbFilterById(currencyId));
        if (currency && currencyDecimals(currency.decimals) !== currencyDecimals(decimals)) {
          throw new Error(
            `${currency.isoCode} amounts are stored with ${currencyDecimals(currency.decimals)} decimals, they can't change`,
            { cause: 'CURRENCY_DECIMALS_FIXED' },
          );
        }
      }
      await Currencies.updateOne(generateDbFilterById(currencyId), {
        $set: {
          updated: new Date(),
          ...doc,
          ...(decimals !== undefined && decimals !== null && { decimals }),
        },
      });
      allCurrencies.clear();
      await emit('CURRENCY_UPDATE', { currencyId });
      return currencyId;
    },

    delete: async (currencyId: string) => {
      const { modifiedCount: deletedCount } = await Currencies.updateOne(
        generateDbFilterById(currencyId),
        {
          $set: {
            deleted: new Date(),
          },
        },
      );
      allCurrencies.clear();
      await emit('CURRENCY_REMOVE', { currencyId });
      return deletedCount;
    },
  };
};

export type CurrenciesModule = Awaited<ReturnType<typeof configureCurrenciesModule>>;
