import { Order, OrdersModule } from '@unchainedshop/types/orders';
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
  if (transaction.state === TransactionState.AUTHORIZED) {
    return (
      transaction.authorizationAmount !== undefined &&
      transaction.authorizationAmount.toFixed(2) === expectedAmount.toFixed(2) &&
      transaction.currency === expectedCurrency
    );
  }
  return false;
};

export const orderIsPaid = async (
  order: Order,
  transaction: Transaction,
  orderModule: OrdersModule,
): Promise<boolean> => {
  const pricing = orderModule.pricingSheet(order);
  const totalAmount = pricing.total({ useNetPrice: false }).amount / 100;
  return transactionIsPaid(transaction, order.currency, totalAmount);
};
