import type { Context } from '../../../context.ts';

export const OrderStatistics = {
  newCount: async ({ dateRange }, _p, { modules }: Context) =>
    modules.orders.statistics.countByDateField('created', dateRange, { includeCarts: true }),

  checkoutCount: async ({ dateRange }, _p, { modules }: Context) =>
    modules.orders.statistics.countByDateField('ordered', dateRange),

  rejectCount: async ({ dateRange }, _p, { modules }: Context) =>
    modules.orders.statistics.countByDateField('rejected', dateRange),

  confirmCount: async ({ dateRange }, _p, { modules }: Context) =>
    modules.orders.statistics.countByDateField('confirmed', dateRange),

  fulfillCount: async ({ dateRange }, _p, { modules }: Context) =>
    modules.orders.statistics.countByDateField('fulfilled', dateRange),

  newRecords: async ({ dateRange }, _p, { modules }: Context) =>
    modules.orders.statistics.aggregateByDateField('created', dateRange, { includeCarts: true }),

  checkoutRecords: async ({ dateRange }, _p, { modules }: Context) =>
    modules.orders.statistics.aggregateByDateField('ordered', dateRange),

  rejectRecords: async ({ dateRange }, _p, { modules }: Context) =>
    modules.orders.statistics.aggregateByDateField('rejected', dateRange),

  confirmRecords: async ({ dateRange }, _p, { modules }: Context) =>
    modules.orders.statistics.aggregateByDateField('confirmed', dateRange),

  fulfilledRecords: async ({ dateRange }, _p, { modules }: Context) =>
    modules.orders.statistics.aggregateByDateField('fulfilled', dateRange),
};
