import { Context } from '../../../context.js';

function buildDateMatch(dateField: string, dateRange?: { start?: string; end?: string }) {
  if (!dateRange?.start && !dateRange?.end) return { [dateField]: { $exists: true } };

  const rangeMatch: Record<string, any> = {};
  if (dateRange?.start) rangeMatch.$gte = new Date(dateRange.start);
  if (dateRange?.end) rangeMatch.$lte = new Date(dateRange.end);

  return { [dateField]: rangeMatch };
}

async function aggregateOrders(
  modules: Context['modules'],
  dateField: string,
  dateRange?: { start?: string; end?: string },
  options?: { includeAmount?: boolean },
) {
  const match = buildDateMatch(dateField, dateRange);

  const pipeline: any[] = [{ $match: match }];

  if (options?.includeAmount) {
    pipeline.push({
      $addFields: {
        orderTotal: {
          $reduce: {
            input: { $ifNull: ['$calculation', []] },
            initialValue: 0,
            in: { $add: ['$$value', { $ifNull: ['$$this.amount', 0] }] },
          },
        },
      },
    });

    pipeline.push({
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: `$${dateField}` } },
          currency: '$currencyCode',
        },
        totalAmount: { $sum: '$orderTotal' },
        count: { $sum: 1 },
      },
    });

    pipeline.push({
      $project: {
        _id: 0,
        date: '$_id.date',
        total: { amount: '$totalAmount', currencyCode: '$_id.currency' },
        count: 1,
      },
    });

    pipeline.push({ $sort: { date: 1 } });
    return modules.orders.aggregateOrders({ pipeline });
  }
  // Just count total orders
  pipeline.push({ $count: 'count' });
  const result = await modules.orders.aggregateOrders({ pipeline });
  return result[0]?.count ?? 0;
}
export const OrderStatistics = {
  newCount: async (_p, { dateRange }, { modules }: Context) =>
    aggregateOrders(modules, 'created', dateRange),

  checkoutCount: async (_p, { dateRange }, { modules }: Context) =>
    aggregateOrders(modules, 'ordered', dateRange),

  rejectCount: async (_p, { dateRange }, { modules }: Context) =>
    aggregateOrders(modules, 'rejected', dateRange),

  confirmCount: async (_p, { dateRange }, { modules }: Context) =>
    aggregateOrders(modules, 'confirmed', dateRange),

  fulfillCount: async (_p, { dateRange }, { modules }: Context) =>
    aggregateOrders(modules, 'fullfilled', dateRange),

  newRecords: async (_p, { dateRange }, { modules }: Context) =>
    aggregateOrders(modules, 'created', dateRange, { includeAmount: true }),

  checkoutRecords: async (_p, { dateRange }, { modules }: Context) =>
    aggregateOrders(modules, 'ordered', dateRange, { includeAmount: true }),

  rejectRecords: async (_p, { dateRange }, { modules }: Context) =>
    aggregateOrders(modules, 'rejected', dateRange, { includeAmount: true }),

  confirmRecords: async (_p, { dateRange }, { modules }: Context) =>
    aggregateOrders(modules, 'confirmed', dateRange, { includeAmount: true }),

  fulfilledRecords: async (_p, { dateRange }, { modules }: Context) =>
    aggregateOrders(modules, 'fullfilled', dateRange, { includeAmount: true }),
};
