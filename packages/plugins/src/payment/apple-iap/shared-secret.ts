import { timingSafeStringEqual } from '@unchainedshop/utils';

export class AppleIAPWebhookError extends Error {}

export const assertAppleIAPSharedSecret = async (password: unknown): Promise<void> => {
  const { APPLE_IAP_SHARED_SECRET } = process.env;

  if (!APPLE_IAP_SHARED_SECRET) {
    throw new AppleIAPWebhookError('APPLE_IAP_SHARED_SECRET is not configured');
  }
  if (typeof password !== 'string') {
    throw new AppleIAPWebhookError('shared secret not valid');
  }
  if (!(await timingSafeStringEqual(password, APPLE_IAP_SHARED_SECRET))) {
    throw new AppleIAPWebhookError('shared secret not valid');
  }
};

export const assertTransactionId = (transactionId: unknown): string => {
  if (typeof transactionId !== 'string' || !transactionId) {
    throw new AppleIAPWebhookError('transaction id has to be a non-empty string');
  }
  return transactionId;
};
