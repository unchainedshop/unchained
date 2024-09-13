import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';

export default async function workStatistics(
  root: never,
  params: { types?: string[]; from?: Date; to?: Date },
  { modules, userId }: Context,
) {
  log(`query workStatistics ${params.from || ''} ${params.to || ''}`, {
    userId,
  });

  return modules.worker.getReport(params);
}
