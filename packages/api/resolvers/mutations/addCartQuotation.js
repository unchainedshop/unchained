import { log } from 'meteor/unchained:core-logger';
import { Quotations, QuotationStatus } from 'meteor/unchained:core-quotations';
import {
  QuotationNotFoundError,
  QuotationWrongStatusError
} from '../../errors';
import getCart from '../../getCart';

export default function(
  root,
  { orderId, quotationId, quantity, configuration },
  { userId, countryContext }
) {
  log(
    `mutation addCartQuotation ${quotationId} ${quantity} ${
      configuration ? JSON.stringify(configuration) : ''
    }`,
    { userId, orderId }
  );
  const quotation = Quotations.findOne({ _id: quotationId });
  if (!quotation) throw new QuotationNotFoundError({ data: { quotationId } });
  if (quotation.status !== QuotationStatus.PROPOSED) {
    throw new QuotationWrongStatusError({ data: { status: quotation.status } });
  }
  const cart = getCart({ orderId, userId, countryContext });
  return cart.addQuotationItem({
    quotation,
    quantity,
    configuration
  });
}
