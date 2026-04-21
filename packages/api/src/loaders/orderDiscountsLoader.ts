import type { UnchainedCore } from '@unchainedshop/core';
import type { OrderDiscount } from '@unchainedshop/core-orders';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ orderId: string }, OrderDiscount[]>(async (queries) => {
    const orderIds = [...new Set(queries.map((q) => q.orderId).filter(Boolean))];

    const discounts = await unchainedAPI.modules.orders.discounts.findOrderDiscounts({
      orderIds,
    });

    const discountsMap: Record<string, OrderDiscount[]> = {};
    for (const discount of discounts) {
      if (!discountsMap[discount.orderId]) {
        discountsMap[discount.orderId] = [discount];
      } else {
        discountsMap[discount.orderId].push(discount);
      }
    }

    return queries.map((q) => discountsMap[q.orderId] || []);
  });
