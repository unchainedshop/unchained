import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';

export default async function workStatistics(
  root: Root,
  params: { type?: string; from?: Date; to?: Date },
  { modules, userId }: Context,
) {
  log(`query workStatistics ${params.from || ''} ${params.to || ''}`, {
    userId,
  });

  return modules.worker.getReport(params);
}
