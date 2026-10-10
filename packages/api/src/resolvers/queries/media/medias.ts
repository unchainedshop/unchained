import { log } from '@unchainedshop/logger';
import type { SortOption } from '@unchainedshop/utils';
import type { FileQuery } from '@unchainedshop/core-files';
import type { Context } from '../../../context.ts';

export default async function medias(
  root: never,
  params: FileQuery & { limit: number; offset: number; sort?: SortOption[] },
  { modules, userId }: Context,
) {
  log(`query medias: ${params.limit} ${params.offset}`, { userId });

  return modules.files.findFiles(params);
}
