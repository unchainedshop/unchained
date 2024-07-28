import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';

export default async function eventStatistics(
  root: Root,
  params: { types?: string[]; from?: Date; to?: Date },
  { userId, modules }: Context,
) {
  log(`query eventStatistics ${params.types || ''} ${params.from || ''} ${params.to || ''}`, {
    userId,
  });

  return modules.events.getReport(params);
}
