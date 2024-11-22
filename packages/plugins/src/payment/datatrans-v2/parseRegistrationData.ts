import splitProperties from './splitProperties.js';
import { StatusResponseSuccess } from './api/types.js';

export default function parseRegistrationData(transaction: StatusResponseSuccess) {
  const parsed = Object.entries(transaction).reduce((acc, [objectKey, payload]) => {
    const { token, info, _id } = splitProperties({ objectKey, payload });
    if (token) {
      return {
        _id,
        token,
        info,
        objectKey,
      };
    }
    return acc;
  }, {}) as {
    _id?: string;
    token?: Record<string, unknown>;
    info?: Record<string, unknown>;
    objectKey?: string;
  };
  if (parsed.objectKey) {
    return {
      ...parsed,
      paymentMethod: transaction.paymentMethod,
      currency: transaction.currency,
      language: transaction.language,
      type: transaction.type,
    };
  }
  return null;
}
