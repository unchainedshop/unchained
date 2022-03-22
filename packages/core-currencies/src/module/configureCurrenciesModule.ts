import { ModuleInput, ModuleMutations } from '@unchainedshop/types/common';
import { CurrenciesModule, Currency } from '@unchainedshop/types/currencies';
import { emit, registerEvents } from 'meteor/unchained:events';
import { generateDbMutations, generateDbFilterById } from 'meteor/unchained:utils';
import { CurrenciesCollection } from '../db/CurrenciesCollection';
import { CurrenciesSchema } from '../db/CurrenciesSchema';

const CURRENCY_EVENTS: string[] = ['CURRENCY_CREATE', 'CURRENCY_UPDATE', 'CURRENCY_REMOVE'];

type FindQuery = {
  includeInactive?: boolean;
  contractAddress?: string;
};
const buildFindSelector = ({ includeInactive = false, contractAddress }: FindQuery) => {
  const selector: { isActive?: true; deleted: null; contractAddress?: string } = { deleted: null };
  if (!includeInactive) selector.isActive = true;
  if (contractAddress) selector.contractAddress = contractAddress;
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

    findCurrencies: async ({ limit, offset, includeInactive, contractAddress }) => {
      const currencies = Currencies.find(buildFindSelector({ includeInactive, contractAddress }), {
        skip: offset,
        limit,
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
  };
};
