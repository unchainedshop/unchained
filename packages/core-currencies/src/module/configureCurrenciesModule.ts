import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateDbFilterById,
  buildSortOptions,
  generateDbObjectId,
  type ModuleInput,
  assertDocumentDBCompatMode,
  mongodb,
} from '@unchainedshop/mongodb';
import { SortDirection, type SortOption } from '@unchainedshop/utils';
import { CurrenciesCollection, type Currency, type CurrencyQuery } from '../db/CurrenciesCollection.ts';

const CURRENCY_EVENTS: string[] = ['CURRENCY_CREATE', 'CURRENCY_UPDATE', 'CURRENCY_REMOVE'];

export const buildFindSelector = ({
  includeInactive = false,
  contractAddress,
  queryString,
  ...rest
}: CurrencyQuery) => {
  const selector: mongodb.Filter<Currency> = {
    ...rest,
    deleted: null,
  };
  if (!includeInactive) selector.isActive = true;
  if (contractAddress) selector.contractAddress = contractAddress;
  if (queryString) {
    assertDocumentDBCompatMode();
    selector.$text = { $search: queryString };
  }
  return selector;
};

export const configureCurrenciesModule = async ({ db }: ModuleInput<Record<string, never>>) => {
  registerEvents(CURRENCY_EVENTS);

  const Currencies = await CurrenciesCollection(db);

  return {
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
      if (doc.isoCode) {
        doc.isoCode = doc.isoCode.toUpperCase();
      }
      await Currencies.updateOne(generateDbFilterById(currencyId), {
        $set: {
          updated: new Date(),
          ...doc,
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
