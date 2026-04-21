import type { UnchainedCore } from '@unchainedshop/core';
import type { OrderPayment } from '@unchainedshop/core-orders';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ orderPaymentId: string }, OrderPayment | null>(async (queries) => {
    const orderPaymentIds = [...new Set(queries.map((q) => q.orderPaymentId).filter(Boolean))];

    const payments = await unchainedAPI.modules.orders.payments.findOrderPayments({
      orderPaymentIds,
    });

    const paymentMap: Record<string, OrderPayment> = {};
    for (const payment of payments) {
      paymentMap[payment._id] = payment;
    }

    return queries.map((q) => paymentMap[q.orderPaymentId] ?? null);
  });
