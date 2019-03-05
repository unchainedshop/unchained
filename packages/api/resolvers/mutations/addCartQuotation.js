import { log } from 'meteor/unchained:core-logger';
import { Quotations } from 'meteor/unchained:core-quotations';
import { Users } from 'meteor/unchained:core-users';
import { Orders } from 'meteor/unchained:core-orders';
import {
  QuotationNotFoundError, UserNotFoundError,
  OrderNotFoundError, OrderWrongStatusError,
} from '../../errors';

export default function (root, {
  orderId, quotationId, quantity, configuration,
}, { userId, countryContext }) {
  log(`mutation addCartQuotation ${quotationId} ${quantity} ${configuration ? JSON.stringify(configuration) : ''}`, { userId, orderId });
  const quotationCount = Quotations.find({ _id: quotationId }).count();
  if (quotationCount === 0) throw new QuotationNotFoundError({ data: { quotationId } });
  if (orderId) {
    const order = Orders.findOne({ _id: orderId });
    if (!order) throw new OrderNotFoundError({ orderId });
    if (!order.isCart()) {
      throw new OrderWrongStatusError({ data: { status: order.status } });
    }
    return order.addQuotationItem({
      quotationId,
      quantity,
      configuration,
    });
  }
  const user = Users.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError({ userId });
  const cart = user.initCart({ countryContext });
  return cart.addQuotationItem({
    quotationId,
    quantity,
    configuration,
  });
}
