export type TransactionStatus = 'AUTHORIZED' | 'CANCELED' | 'CAPTURED' | 'PENDING';

export interface TransactionAmount {
  Value: string;
  CurrencyCode: string;
}
