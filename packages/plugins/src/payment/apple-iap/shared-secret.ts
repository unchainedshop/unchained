import { timingSafeStringEqual } from '@unchainedshop/utils';

export const isValidAppleIAPSharedSecret = async (password: unknown): Promise<boolean> => {
  const { APPLE_IAP_SHARED_SECRET } = process.env;
  if (!APPLE_IAP_SHARED_SECRET || typeof password !== 'string') return false;
  return timingSafeStringEqual(password, APPLE_IAP_SHARED_SECRET);
};

export const assertTransactionId = (transactionId: unknown): string => {
  if (typeof transactionId !== 'string' || !transactionId) {
    throw new Error('transaction id has to be a non-empty string', {
      cause: 'APPLE_IAP_WEBHOOK_INVALID',
    });
  }
  return transactionId;
};
