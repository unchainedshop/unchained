import { log } from 'meteor/unchained:core-logger';
import { Quotations } from 'meteor/unchained:core-quotations';
import { transformQuotation } from '../transformations/transformQuotation';
import { InvalidIdError } from '../../errors';

export default function quotation(root, { quotationId }, { modules, userId }) {
  log(`query quotation ${quotationId}`, { userId, quotationId });

  if (!quotationId) throw new InvalidIdError({ quotationId });
  const quotation = Quotations.findQuotation({ quotationId });
  return transformQuotation(modules)(quotation);
}
