import { ModuleInput } from '@unchainedshop/types/common';
import { CurrenciesModule, Currency } from '@unchainedshop/types/currencies';
import { emit, registerEvents } from 'meteor/unchained:events';
import { generateDbMutations } from 'meteor/unchained:utils';
import { CurrenciesCollection } from '../db/CurrenciesCollection';
import { CurrencySchema } from '../db/CurrenciesSchema';

const CURRENCY_EVENTS: string[] = ['CURRENCY_CREATE', 'CURRENCY_REMOVE'];
type FindQuery = {
  includeInactive?: boolean;
};
const buildFindSelector = ({ includeInactive = false }: FindQuery) => {
  const selector: { isActive?: true } = {};
  if (!includeInactive) selector.isActive = true;
  return selector;
};

export const configureCurrencyModule = async ({
  db,
}: ModuleInput): Promise<CurrenciesModule> => {
  registerEvents(CURRENCY_EVENTS);

  const Currencies = await CurrenciesCollection(db);

  const mutations = generateDbMutations<Currency>(Currencies, CurrencySchema);

  return {
    findCurrency: async ({ currencyId, isoCode }) => {
      return await Currencies.findOne(
        currencyId ? { _id: currencyId } : { isoCode }
      );
    },

    findCurrencies: async ({ limit, offset, includeInactive }) => {
      const currencies = await Currencies.find(
        buildFindSelector({ includeInactive }),
        {
          skip: offset,
          limit,
        }
      );
      return currencies.toArray();
    },

    count: async (query) => {
      const count = await Currencies.find(buildFindSelector(query)).count();
      return count;
    },

    currencyExists: async ({ currencyId }) => {
      const currencyCount = await Currencies.find(
        { _id: currencyId },
        { limit: 1 }
      ).count();
      return !!currencyCount;
    },

    create: async (doc: Currency, userId?: string) => {
      const currencyId = await mutations.create(doc, userId);
      emit('CURRENCY_CREATE', { currencyId });
      return currencyId;
    },
    update: async (_id: string, doc: Currency, userId?: string) => {
      const currencyId = await mutations.update(_id, doc, userId);
      emit('CURRENCY_UPDATE', { currencyId });
      return currencyId;
    },
    delete: async (currencyId) => {
      const deletedCount = await mutations.delete(currencyId);
      emit('CURRENCY_REMOVE', { currencyId });
      return deletedCount;
    },
  };
};
