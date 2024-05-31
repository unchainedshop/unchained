import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function tokens(
  root: Root,
  {
    limit = 10,
    offset = 0,
  }: {
    limit: number;
    offset: number;
  },
  { modules, userId }: Context,
) {
  log(`query tokens`, { userId });

  return modules.warehousing.findTokens({}, { limit, skip: offset });
}
