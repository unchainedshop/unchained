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
  options?: { includeAmount?: boolean; includeCarts?: boolean },
) {
  const match = buildDateMatch(dateField, dateRange);

  const pipeline: any[] = [{ $match: match }];

  if (options?.includeCarts) {
    match.status = null;
    match.orderNumber = null;
  }

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
  newCount: async ({ dateRange }, _p, { modules }: Context) =>
    aggregateOrders(modules, 'created', dateRange, { includeCarts: true }),

  checkoutCount: async ({ dateRange }, _p, { modules }: Context) =>
    aggregateOrders(modules, 'ordered', dateRange),

  rejectCount: async ({ dateRange }, _p, { modules }: Context) =>
    aggregateOrders(modules, 'rejected', dateRange),

  confirmCount: async ({ dateRange }, _p, { modules }: Context) =>
    aggregateOrders(modules, 'confirmed', dateRange),

  fulfillCount: async ({ dateRange }, _p, { modules }: Context) =>
    aggregateOrders(modules, 'fullfilled', dateRange),

  newRecords: async ({ dateRange }, _p, { modules }: Context) =>
    aggregateOrders(modules, 'created', dateRange, { includeAmount: true, includeCarts: true }),

  checkoutRecords: async ({ dateRange }, _p, { modules }: Context) =>
    aggregateOrders(modules, 'ordered', dateRange, { includeAmount: true }),

  rejectRecords: async ({ dateRange }, _p, { modules }: Context) =>
    aggregateOrders(modules, 'rejected', dateRange, { includeAmount: true }),

  confirmRecords: async ({ dateRange }, _p, { modules }: Context) =>
    aggregateOrders(modules, 'confirmed', dateRange, { includeAmount: true }),

  fulfilledRecords: async ({ dateRange }, _p, { modules }: Context) =>
    aggregateOrders(modules, 'fullfilled', dateRange, { includeAmount: true }),
};
