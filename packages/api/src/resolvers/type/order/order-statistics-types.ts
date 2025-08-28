import { Context } from '../../../context.js';

const project = {
  $project: {
    date: '$_id.date',
    total: {
      amount: '$total',
      currency: '$_id.currency',
    },
    _id: 0,
  },
};

async function getRecords(
  modules: Context['modules'],
  dateField: string,
  dateRange?: { start?: string; end?: string },
) {
  const match: Record<string, any> = {};

  if (dateRange?.start || dateRange?.end) {
    match[dateField] = {};
    if (dateRange?.start) match[dateField].$gte = new Date(dateRange.start);
    if (dateRange?.end) match[dateField].$lte = new Date(dateRange.end);
  } else {
    match[dateField] = { $exists: true };
  }

  const group = {
    $group: {
      _id: {
        date: { $dateToString: { format: '%Y-%m-%d', date: `$${dateField}` } },
        currency: '$currencyCode',
      },
      total: { $sum: '$total.gross' },
    },
  };

  const sort: any = { $sort: { date: 1 } };

  return modules.orders.aggregateOrders({ match, project, group, sort });
}

export const OrderStatistics = {
  confirmRecords: (_p, { dateRange }, { modules }: Context) =>
    getRecords(modules, 'confirmed', dateRange),

  checkoutRecords: (_p, { dateRange }, { modules }: Context) =>
    getRecords(modules, 'ordered', dateRange),

  rejectRecords: (_p, { dateRange }, { modules }: Context) => getRecords(modules, 'rejected', dateRange),

  newRecords: (_p, { dateRange }, { modules }: Context) => getRecords(modules, 'created', dateRange),
};
