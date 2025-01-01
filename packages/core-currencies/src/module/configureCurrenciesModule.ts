import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateDbFilterById,
  buildSortOptions,
  generateDbObjectId,
  ModuleInput,
} from '@unchainedshop/mongodb';
import { SortDirection, SortOption } from '@unchainedshop/utils';
import { CurrenciesCollection, Currency, CurrencyQuery } from '../db/CurrenciesCollection.js';

const CURRENCY_EVENTS: string[] = ['CURRENCY_CREATE', 'CURRENCY_UPDATE', 'CURRENCY_REMOVE'];

export const buildFindSelector = ({
  includeInactive = false,
  contractAddress,
  queryString,
}: CurrencyQuery) => {
  const selector: { isActive?: true; deleted: null; contractAddress?: string; $text?: any } = {
    deleted: null,
  };
  if (!includeInactive) selector.isActive = true;
  if (contractAddress) selector.contractAddress = contractAddress;
  if (queryString) selector.$text = { $search: queryString };
  return selector;
};

export const configureCurrenciesModule = async ({ db }: ModuleInput<Record<string, never>>) => {
  registerEvents(CURRENCY_EVENTS);

  const Currencies = await CurrenciesCollection(db);

  return {
    findCurrency: async ({
      currencyId,
      isoCode,
    }: {
      currencyId?: string;
      isoCode?: string;
    }): Promise<Currency> => {
      return Currencies.findOne(currencyId ? generateDbFilterById(currencyId) : { isoCode });
    },

    findCurrencies: async ({
      limit,
      offset,
      sort,
      ...query
    }: CurrencyQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    }): Promise<Array<Currency>> => {
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

    create: async (doc: Currency) => {
      await Currencies.deleteOne({ isoCode: doc.isoCode.toUpperCase(), deleted: { $ne: null } });
      const { insertedId: currencyId } = await Currencies.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        ...doc,
        isoCode: doc.isoCode.toUpperCase(),
        isActive: true,
      });
      await emit('CURRENCY_CREATE', { currencyId });
      return currencyId;
    },

    update: async (currencyId: string, doc: Partial<Currency>) => {
      await Currencies.updateOne(generateDbFilterById(currencyId), {
        $set: {
          updated: new Date(),
          ...doc,
          isoCode: doc.isoCode.toUpperCase(),
        },
      });
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
      await emit('CURRENCY_REMOVE', { currencyId });
      return deletedCount;
    },
  };
};

export type CurrenciesModule = Awaited<ReturnType<typeof configureCurrenciesModule>>;
