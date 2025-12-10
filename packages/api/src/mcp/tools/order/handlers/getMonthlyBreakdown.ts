import type { Context } from '../../../../context.ts';
import { formatSummaryMap, resolveDateRange, resolveOrderFilters } from '../../../utils/orderFilters.ts';
import type { Params } from '../schemas.ts';

export default async function getMonthlyBreakdown(
  context: Context,
  params: Params<'MONTHLY_BREAKDOWN'>,
) {
  const { modules } = context;
  const { from, to, paymentProviderIds, deliveryProviderIds, status } = params;
  const { startDate, endDate } = resolveDateRange(from, to);

  const filters = await resolveOrderFilters(modules, { paymentProviderIds, deliveryProviderIds });
  if (!filters) {
    return {
      totalSalesAmount: 0,
      orderCount: 0,
      averageOrderValue: 0,
      currencyCode: null,
      summary: [],
      dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
    };
  }

  const orders = await modules.orders.findOrders({
    dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
    status,
    ...filters,
  } as any);

  let totalSalesAmount = 0;
  let orderCount = 0;

  const monthlyMap = new Map<string, { sales: number; orders: number }>();

  for (let i = 0; i < 12; i++) {
    const date = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
    const label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(label, { sales: 0, orders: 0 });
  }

  for (const order of orders) {
    const orderDate = new Date(order.created);
    if (orderDate < startDate || orderDate > endDate) continue;

    orderCount++;
    const itemsAmount = order.calculation?.find((c) => c.category === 'ITEMS')?.amount || 0;
    totalSalesAmount += itemsAmount;

    const label = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
    const entry = monthlyMap.get(label);
    if (entry) {
      entry.sales += itemsAmount;
      entry.orders += 1;
    }
  }

  const averageOrderValue = orderCount > 0 ? totalSalesAmount / orderCount : 0;

  return {
    totalSalesAmount,
    orderCount,
    averageOrderValue,
    currencyCode: orders[0]?.currencyCode ?? null,
    summary: formatSummaryMap(monthlyMap),
    dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
  };
}
