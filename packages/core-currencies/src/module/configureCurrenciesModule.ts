import { ModuleInput, ModuleMutations } from '@unchainedshop/types/core.js';
import { CurrenciesModule, Currency, CurrencyQuery } from '@unchainedshop/types/currencies.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbMutations, generateDbFilterById, buildSortOptions } from '@unchainedshop/mongodb';
import { SortDirection, SortOption } from '@unchainedshop/utils';
import { CurrenciesCollection } from '../db/CurrenciesCollection.js';
import { CurrenciesSchema } from '../db/CurrenciesSchema.js';

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

export const configureCurrenciesModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<CurrenciesModule> => {
  registerEvents(CURRENCY_EVENTS);

  const Currencies = await CurrenciesCollection(db);

  const mutations = generateDbMutations<Currency>(
    Currencies,
    CurrenciesSchema,
  ) as ModuleMutations<Currency>;

  return {
    findCurrency: async ({ currencyId, isoCode }) => {
      return Currencies.findOne(currencyId ? generateDbFilterById(currencyId) : { isoCode });
    },

    findCurrencies: async ({ limit, offset, sort, ...query }) => {
      const defaultSort = [{ key: 'created', value: SortDirection.ASC }] as SortOption[];
      const currencies = Currencies.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: buildSortOptions(sort || defaultSort),
      });
      return currencies.toArray();
    },

    count: async (query) => {
      const count = await Currencies.countDocuments(buildFindSelector(query));
      return count;
    },

    currencyExists: async ({ currencyId }) => {
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
      const currencyId = await mutations.create({
        ...doc,
        isoCode: doc.isoCode.toUpperCase(),
        isActive: true,
      });
      await emit('CURRENCY_CREATE', { currencyId });
      return currencyId;
    },

    update: async (_id: string, doc: Partial<Currency>) => {
      const currencyId = await mutations.update(_id, {
        ...doc,
        isoCode: doc.isoCode.toUpperCase(),
      });
      await emit('CURRENCY_UPDATE', { currencyId });
      return currencyId;
    },

    delete: async (currencyId) => {
      const deletedCount = await mutations.delete(currencyId);
      await emit('CURRENCY_REMOVE', { currencyId });
      return deletedCount;
    },

    deletePermanently: async (_id) => {
      return mutations.deletePermanently(_id);
    },
  };
};
