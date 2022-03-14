import { OrdersModule } from '@unchainedshop/types/orders';
import { Transaction } from 'postfinancecheckout/src/models/Transaction';
import { TransactionState } from 'postfinancecheckout/src/models/TransactionState';

export const transactionIsPaid = async (
  transaction: Transaction,
  expectedCurrency: string,
  expectedAmount: number,
): Promise<boolean> => {
  if (transaction.state === TransactionState.FULFILL) {
    return (
      transaction.completedAmount !== undefined &&
      transaction.completedAmount.toFixed(2) === expectedAmount.toFixed(2) &&
      transaction.currency === expectedCurrency
    );
  }
  return false;
};

export const orderIsPaid = async (
  transaction: Transaction,
  orderModule: OrdersModule,
): Promise<boolean> => {
  const { orderPaymentId } = transaction.metaData as { orderPaymentId: string };
  if (!orderPaymentId) {
    return false;
  }
  const orderPayment = await orderModule.payments.findOrderPayment({
    orderPaymentId,
  });
  const order = await orderModule.findOrder({ orderId: orderPayment.orderId });
  const pricing = orderModule.pricingSheet(order);
  const totalAmount = pricing.total({ useNetPrice: false }).amount / 100;
  return transactionIsPaid(transaction, order.currency, totalAmount);
};
