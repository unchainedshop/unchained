import { OrderPricingSheet } from '@unchainedshop/core';
import { Order } from '@unchainedshop/core-orders';
import { Transaction, TransactionState } from './api-types.js';

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

export const orderIsPaid = async (order: Order, transaction: Transaction): Promise<boolean> => {
  const pricing = OrderPricingSheet({
    calculation: order.calculation,
    currencyCode: order.currencyCode,
  });
  const totalAmount = pricing.total({ useNetPrice: false }).amount / 100;
  return transactionIsPaid(transaction, order.currencyCode, totalAmount);
};
