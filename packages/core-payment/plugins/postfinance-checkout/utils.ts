import { Transaction } from 'postfinancecheckout/src/models/Transaction';
import { TransactionState } from 'postfinancecheckout/src/models/TransactionState';

export const transactionIsPaid = async (
  transaction: Transaction,
  expectedCurrency: string,
  expectedAmount: number,
): Promise<boolean> => {
  if (transaction.state === TransactionState.FULFILL) {
    return (
      transaction.totalSettledAmount.toFixed(2) === expectedAmount.toFixed(2) &&
      transaction.currency === expectedCurrency
    );
  }
  return false;
};
