import { log } from 'meteor/unchained:core-logger';
import { Subscriptions } from 'meteor/unchained:core-subscriptions';
import { Products, ProductStatus } from 'meteor/unchained:core-products';
import {
  ProductNotFoundError,
  UserNotFoundError,
  ProductWrongStatusError,
  InvalidIdError,
} from '../../errors';

export default async function createSubscription(
  root,
  { contact, plan, billingAddress, payment, delivery, meta },
  { countryContext, userId, user }
) {
  log('mutation createSubscription', { userId });
  if (!user) throw new UserNotFoundError({ userId });
  const { configuration, quantity, productId } = plan;
  const product = Products.findProduct({
    productId: plan.productId,
  });
  if (!productId) throw new InvalidIdError({ productId });
  if (!product) {
    throw new ProductNotFoundError({
      productId: plan.productId,
    });
  }
  if (product.status !== ProductStatus.ACTIVE) {
    throw new ProductWrongStatusError({ status: product.status });
  }
  return Subscriptions.createSubscription({
    productId,
    configuration,
    quantity,
    userId,
    countryCode: countryContext,
    payment,
    delivery,
    contact,
    billingAddress,
    meta,
  });
}
