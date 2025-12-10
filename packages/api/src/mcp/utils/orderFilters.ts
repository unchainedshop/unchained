import type { Context } from '../../context.ts';

export const resolveOrderFilters = async (
  modules: Context['modules'],
  {
    paymentProviderIds,
    deliveryProviderIds,
  }: {
    paymentProviderIds?: string[];
    deliveryProviderIds?: string[];
  },
) => {
  const [orderPayments, orderDeliveries] = await Promise.all([
    paymentProviderIds?.length
      ? modules.orders.payments.findOrderPaymentsByProviderIds({ paymentProviderIds })
      : [],
    deliveryProviderIds?.length
      ? modules.orders.deliveries.findDeliveryByProvidersId({ deliveryProviderIds })
      : [],
  ]);

  if (
    (paymentProviderIds?.length && !orderPayments.length) ||
    (deliveryProviderIds?.length && !orderDeliveries.length)
  ) {
    return null;
  }

  return {
    paymentIds: orderPayments.map((p) => p._id),
    deliveryIds: orderDeliveries.map((d) => d._id),
  };
};

export const formatSummaryMap = (
  map: Map<string, { sales: number; orders: number }>,
): { date: string; sales: number; orders: number; avgOrderValue: number }[] => {
  return Array.from(map.entries())
    .reverse()
    .map(([date, { sales, orders }]) => ({
      date,
      sales: Number(sales.toFixed(2)),
      orders,
      avgOrderValue: orders > 0 ? Math.round(sales / orders) : 0,
    }));
};

export const resolveDateRange = (from?: string, to?: string, fallbackDays = 30) => {
  const endDate = to ? new Date(to) : new Date();
  const startDate = from ? new Date(from) : new Date(endDate.getTime() - (fallbackDays - 1) * 86400000);
  return { startDate, endDate };
};
