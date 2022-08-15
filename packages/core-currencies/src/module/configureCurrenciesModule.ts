import { ModuleInput, ModuleMutations } from '@unchainedshop/types/core';
import { CurrenciesModule, Currency, CurrencyQuery } from '@unchainedshop/types/currencies';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbMutations, generateDbFilterById, buildSortOptions } from '@unchainedshop/utils';
import { CurrenciesCollection } from '../db/CurrenciesCollection';
import { CurrenciesSchema } from '../db/CurrenciesSchema';

const CURRENCY_EVENTS: string[] = ['CURRENCY_CREATE', 'CURRENCY_UPDATE', 'CURRENCY_REMOVE'];

const buildFindSelector = ({ includeInactive = false, contractAddress, queryString }: CurrencyQuery) => {
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
      const currencies = Currencies.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: buildSortOptions(sort),
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

    create: async (doc: Currency, userId: string) => {
      await Currencies.deleteOne({ isoCode: doc.isoCode.toUpperCase(), deleted: { $ne: null } });
      const currencyId = await mutations.create(
        { ...doc, isoCode: doc.isoCode.toUpperCase(), isActive: true },
        userId,
      );
      emit('CURRENCY_CREATE', { currencyId });
      return currencyId;
    },
    update: async (_id: string, doc: Partial<Currency>, userId: string) => {
      const currencyId = await mutations.update(
        _id,
        {
          ...doc,
          isoCode: doc.isoCode.toUpperCase(),
        },
        userId,
      );
      emit('CURRENCY_UPDATE', { currencyId });
      return currencyId;
    },
    delete: async (currencyId, userId) => {
      const deletedCount = await mutations.delete(currencyId, userId);
      emit('CURRENCY_REMOVE', { currencyId });
      return deletedCount;
    },

    deletePermanently: async (_id, userId) => {
      return mutations.deletePermanently(_id, userId);
    },
  };
};
