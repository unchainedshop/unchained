import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { InvalidIdError } from '../../../errors';

export default async function quotation(
  root: Root,
  { quotationId }: { quotationId: string },
  { modules, userId }: Context
) {
  log(`query quotation ${quotationId}`, { userId, quotationId });

  if (!quotationId) throw new InvalidIdError({ quotationId });
  
  return await modules.quotations.findQuotation({ quotationId });
}
