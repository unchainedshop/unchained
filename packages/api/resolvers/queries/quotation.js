import { log } from 'unchained-logger';
import { Quotations } from 'meteor/unchained:core-quotations';
import { InvalidIdError } from '../../errors';

export default function quotation(root, { quotationId }, { userId }) {
  log(`query quotation ${quotationId}`, { userId, quotationId });

  if (!quotationId) throw new InvalidIdError({ quotationId });
  return Quotations.findQuotation({ quotationId });
}
