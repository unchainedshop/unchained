export type TransactionStatus = 'AUTHORIZED' | 'CANCELED' | 'CAPTURED' | 'PENDING';

export type TransactionAmount = {
  Value: string;
  CurrencyCode: string;
};
