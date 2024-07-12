import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';

export default async function eventStatistics(
  root: Root,
  params: { type?: string; from?: Date; to?: Date },
  { modules, userId }: Context,
) {
  log(`query eventStatistics ${params.type || ''} ${params.from || ''} ${params.to || ''}`, {
    userId,
  });

  return modules.events.getReport(params);
}
