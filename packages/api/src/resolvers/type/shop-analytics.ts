import { Context } from '@unchainedshop/types/api.js';

export const ShopAnalytics = {
  orders: async ({ instanceStartTime, startOfToday }, _, { modules }: Context) => {
    const ordersToday = await modules.orders.getReport({ from: startOfToday });
    const ordersSinceInstanceStart = await modules.orders.getReport({ from: instanceStartTime });
    const allOrders = await modules.orders.getReport();
    return {
      today: ordersToday,
      sinceInstanceStart: ordersSinceInstanceStart,
      all: allOrders,
    };
  },

  workItems: async ({ instanceStartTime, startOfToday }, _, { modules }: Context) => {
    const workerToday = await modules.worker.getReport({ from: startOfToday });
    const workerSinceInstanceStart = await modules.worker.getReport({ from: instanceStartTime });
    const allWorks = await modules.worker.getReport();

    return {
      today: workerToday,
      sinceInstanceStart: workerSinceInstanceStart,
      all: allWorks,
    };
  },

  events: async ({ instanceStartTime, startOfToday }, _, { modules }: Context) => {
    const eventsToday = await modules.events.getReport({ from: startOfToday });
    const eventsSinceInstanceStart = await modules.events.getReport({ from: instanceStartTime });
    const allEvents = await modules.events.getReport();
    return {
      today: eventsToday,
      sinceInstanceStart: eventsSinceInstanceStart,
      all: allEvents,
    };
  },
};
