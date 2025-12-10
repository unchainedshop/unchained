import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { InvalidIdError } from '../../../errors.ts';

export default async function quotation(
  root: never,
  { quotationId }: { quotationId: string },
  { modules, userId }: Context,
) {
  log(`query quotation ${quotationId}`, { userId, quotationId });

  if (!quotationId) throw new InvalidIdError({ quotationId });

  return modules.quotations.findQuotation({ quotationId });
}
