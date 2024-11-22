import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { InvalidIdError } from '../../../errors.js';

export default async function quotation(
  root: never,
  { quotationId }: { quotationId: string },
  { modules, userId }: Context,
) {
  log(`query quotation ${quotationId}`, { userId, quotationId });

  if (!quotationId) throw new InvalidIdError({ quotationId });

  return modules.quotations.findQuotation({ quotationId });
}
