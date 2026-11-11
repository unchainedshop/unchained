import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AppleIAP } from './adapter.ts';

const receiptInfo = [{ transaction_id: 'transaction', quantity: '1', product_id: 'product' }];

const charge = (storedCredentials: unknown, transactionContext: Record<string, unknown>) => {
  const modules = {
    orders: { positions: { findOrderPositions: async () => [{ productId: 'product', quantity: 1 }] } },
    payment: { paymentCredentials: { findPaymentCredential: async () => storedCredentials } },
    appleTransactions: { findTransactionById: async () => null, createTransaction: async () => null },
  };
  const context = {
    order: { _id: 'order', userId: 'user' },
    paymentProvider: { _id: 'provider' },
    modules,
  };
  return AppleIAP.actions([], context as any).charge({
    meta: { transactionIdentifier: 'transaction' },
    ...transactionContext,
  });
};

describe('Apple IAP charge', () => {
  it('ignores receipt info that comes with the request', async () => {
    await assert.rejects(
      charge(null, { paymentCredentials: { meta: { latestReceiptInfo: receiptInfo } } }),
      /Cannot match transaction/,
    );
  });

  it('accepts receipt info from the stored credentials', async () => {
    assert.deepStrictEqual(await charge({ meta: { latestReceiptInfo: receiptInfo } }, {}), {
      transactionId: 'transaction',
    });
  });
});
