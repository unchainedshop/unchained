import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { Orders, OrderStatus } from 'meteor/unchained:core-orders';
import { ProductNotFoundError, OrderWrongStatusError, OrderNotFoundError } from '../../errors';

export default function (root, {
  orderId, productId, quantity, configuration,
}, { userId }) {
  log(`mutation addOrderProduct ${productId} ${quantity} ${configuration ? JSON.stringify(configuration) : ''}`, { orderId, userId });
  const order = Orders.findOne({ _id: orderId });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (order.status !== OrderStatus.OPEN) {
    throw new OrderWrongStatusError({ data: { status: order.status } });
  }
  const product = Products.findOne({ _id: productId });
  if (!product) throw new ProductNotFoundError({ data: { productId } });
  return order.addProductItem({
    productId,
    quantity,
    configuration,
  });
}
