import splitProperties from './splitProperties.ts';
import type { StatusResponseSuccess } from './api/types.ts';
import { sha256 } from '@unchainedshop/utils';

export default async function parseRegistrationData(transaction: StatusResponseSuccess) {
  const parsed = Object.entries(transaction).reduce((acc, [objectKey, payload]) => {
    const { token, info } = splitProperties({ objectKey, payload });
    if (token) {
      return {
        token,
        info,
        objectKey,
      };
    }
    return acc;
  }, {}) as {
    token?: Record<string, unknown>;
    info?: Record<string, unknown>;
    objectKey?: string;
  };
  if (parsed.objectKey) {
    const _id = await sha256(parsed.token);

    return {
      ...parsed,
      _id,
      paymentMethod: transaction.paymentMethod,
      currency: transaction.currency,
      language: transaction.language,
      type: transaction.type,
    };
  }
  return null;
}
