import { Context } from '../../../context.js';

export const OrderStatistics = {
  confirmRecords: async (_parent, { dateRange }, { modules }: Context) =>
    modules.orders.getOrderStatisticsRecordsByDate({
      field: 'confirmed',
      dateRange: dateRange,
    }),

  checkoutRecords: async (_parent, { dateRange }, { modules }: Context) =>
    modules.orders.getOrderStatisticsRecordsByDate({
      field: 'ordered',
      dateRange: dateRange,
    }),

  rejectRecords: async (_parent, { dateRange }, { modules }: Context) =>
    modules.orders.getOrderStatisticsRecordsByDate({
      field: 'rejected',
      dateRange: dateRange,
    }),

  newRecords: async (_parent, { dateRange }, { modules }: Context) =>
    modules.orders.getOrderStatisticsRecordsByDate({
      field: 'created',
      dateRange: dateRange,
    }),
};
