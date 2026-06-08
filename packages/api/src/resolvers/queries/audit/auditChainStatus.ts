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

  const entries = await context.auditLog.find({ limit: 1, offset: 0 });
  const lastEntry = entries.length > 0 ? entries[0].time : null;

  const total = result.entries;
  let firstEntry: number | null = null;
  if (total > 0) {
    const oldest = await context.auditLog.find({ limit: 1, offset: total - 1 });
    firstEntry = oldest.length > 0 ? oldest[0].time : null;
  }

  return {
    valid: result.valid,
    totalEntries: result.entries,
    checkedEntries: result.verified,
    firstEntry,
    lastEntry,
    errors: result.error ? [{ sequenceNumber: 0, message: result.error }] : [],
  };
}
