import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function auditChainStatus(_root: never, _params: never, context: Context) {
  log('query auditChainStatus', { userId: context.userId });
  if (!context.auditLog) {
    return {
      valid: true,
      totalEntries: 0,
      checkedEntries: 0,
      firstEntry: null,
      lastEntry: null,
      errors: [],
    };
  }

  const result = await context.auditLog.verify();

  return {
    valid: result.valid,
    totalEntries: result.entries,
    checkedEntries: result.verified,
    firstEntry: null,
    lastEntry: null,
    errors: result.error ? [{ sequenceNumber: 0, message: result.error }] : [],
  };
}
