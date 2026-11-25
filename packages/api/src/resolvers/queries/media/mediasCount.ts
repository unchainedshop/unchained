import { log } from '@unchainedshop/logger';
import type { FileQuery } from '@unchainedshop/core-files';
import type { Context } from '../../../context.ts';

export default async function mediasCount(
  root: never,
  params: FileQuery,
  { modules, userId }: Context,
) {
  log(`query mediasCount`, { userId });

  return modules.files.count(params);
}
