import { Context } from '@unchainedshop/types/api.js';
import { Country } from '@unchainedshop/types/countries.js';
import { Language } from '@unchainedshop/types/languages.js';
import { checkAction } from '../../acl.js';
import { allRoles, actions } from '../../roles/index.js';

type HelperType<T> = (root: never, params: never, context: Context) => Promise<T>;

export interface ShopHelperTypes {
  _id: () => string;
  country: HelperType<Country>;
  language: HelperType<Language>;
  userRoles: HelperType<Array<string>>;
  activities: HelperType<any>;
}

export const Shop: ShopHelperTypes = {
  _id() {
    return 'root';
  },

  language: async (_root, _params, { localeContext, modules }) => {
    return modules.languages.findLanguage({ isoCode: localeContext.language });
  },
  country: async (_root, _params, { countryContext, modules }) => {
    return modules.countries.findCountry({ isoCode: countryContext });
  },

  userRoles: async (_root, _params, context) => {
    await checkAction(context, (actions as any).manageUsers);
    return Object.values(allRoles)
      .map(({ name }) => name)
      .filter((name) => name.substring(0, 2) !== '__');
  },
  activities: async (_root, _params, { modules }) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const uptime = process.uptime();
    const instanceStartTime = new Date(Date.now() - uptime * 1000);
    try {
      const ordersToday = await modules.orders.getReport({ from: startOfToday });
      const ordersSinceInstanceStart = await modules.orders.getReport({ from: instanceStartTime });
      const allOrders = await modules.orders.getReport();
      const workerToday = await modules.worker.getReport({ from: startOfToday });
      const workerSinceInstanceStart = await modules.worker.getReport({ from: instanceStartTime });
      const allWorks = await modules.worker.getReport();
      const eventsToday = await modules.events.getReport({ from: startOfToday });
      const eventsSinceInstanceStart = await modules.events.getReport({ from: instanceStartTime });
      const allEvents = await modules.events.getReport();
      return {
        workItems: {
          today: workerToday,
          sinceInstanceStart: workerSinceInstanceStart,
          all: allWorks,
        },
        events: {
          today: eventsToday,
          sinceInstanceStart: eventsSinceInstanceStart,
          all: allEvents,
        },
        orders: {
          today: ordersToday,
          sinceInstanceStart: ordersSinceInstanceStart,
          all: allOrders,
        },
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  },
};
