import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { InvalidIdError } from '../../../errors.js';

export default async function quotation(
  root: Root,
  { quotationId }: { quotationId: string },
  { modules, userId }: Context,
) {
  log(`query quotation ${quotationId}`, { userId, quotationId });

  if (!quotationId) throw new InvalidIdError({ quotationId });

  return modules.quotations.findQuotation({ quotationId });
}
