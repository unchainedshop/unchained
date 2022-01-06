import { log } from 'meteor/unchained:logger';
import { Quotations } from 'meteor/unchained:core-quotations';
import { InvalidIdError } from '../../../errors';

export default async function quotation(root: Root, { quotationId }, { modules, userId }: Context) {
  log(`query quotation ${quotationId}`, { userId, quotationId });

  if (!quotationId) throw new InvalidIdError({ quotationId });
  return Quotations.findQuotation({ quotationId });
}
