import { OrderPricingSheet } from '@unchainedshop/core';
import { Order } from '@unchainedshop/core-orders';
import * as pf from 'postfinancecheckout';

const { PostFinanceCheckout } = pf;

export const transactionIsPaid = async (
  transaction: pf.PostFinanceCheckout.model.Transaction,
  expectedCurrency: string,
  expectedAmount: number,
): Promise<boolean> => {
  if (transaction.state === PostFinanceCheckout.model.TransactionState.FULFILL) {
    return (
      transaction.completedAmount !== undefined &&
      transaction.completedAmount.toFixed(2) === expectedAmount.toFixed(2) &&
      transaction.currency === expectedCurrency
    );
  }
  if (transaction.state === PostFinanceCheckout.model.TransactionState.AUTHORIZED) {
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
  transaction: pf.PostFinanceCheckout.model.Transaction,
): Promise<boolean> => {
  const pricing = OrderPricingSheet({
    calculation: order.calculation,
    currency: order.currency,
  });
  const totalAmount = pricing.total({ useNetPrice: false }).amount / 100;
  return transactionIsPaid(transaction, order.currency, totalAmount);
};
