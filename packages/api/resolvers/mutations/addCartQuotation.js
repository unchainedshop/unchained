import { log } from 'meteor/unchained:core-logger';
import { Quotations, QuotationStatus } from 'meteor/unchained:core-quotations';
import { Users } from 'meteor/unchained:core-users';
import { Orders } from 'meteor/unchained:core-orders';
import {
  QuotationNotFoundError,
  UserNotFoundError,
  QuotationWrongStatusError,
  OrderNotFoundError,
  OrderWrongStatusError
} from '../../errors';

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
  if (orderId) {
    const order = Orders.findOne({ _id: orderId });
    if (!order) throw new OrderNotFoundError({ orderId });
    if (!order.isCart()) {
      throw new OrderWrongStatusError({ data: { status: order.status } });
    }
    return order.addQuotationItem({
      quotation,
      quantity,
      configuration
    });
  }
  const user = Users.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError({ userId });
  const cart = user.initCart({ countryContext });
  return cart.addQuotationItem({
    quotation,
    quantity,
    configuration
  });
}
