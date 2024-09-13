import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';

export default async function eventStatistics(
  root: never,
  params: { types?: string[]; from?: Date; to?: Date },
  { userId, modules }: Context,
) {
  log(`query eventStatistics ${params.types || ''} ${params.from || ''} ${params.to || ''}`, {
    userId,
  });

  return modules.events.getReport(params);
}
