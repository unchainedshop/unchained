import {
  Orders,
  OrderPayments,
  OrderDeliveries,
  OrderPositions,
  OrderDiscounts,
} from 'meteor/unchained:core-orders';
import { ProductReviews } from 'meteor/unchained:core-products';
import { Quotations } from 'meteor/unchained:core-quotations';
import { Subscriptions } from 'meteor/unchained:core-subscriptions';
import { PaymentCredentials } from 'meteor/unchained:core-payment';
import { Promise } from 'meteor/promise';

export default (role, actions) => {
  const isMyself = (
    root,
    { userId: foreignUserId } = {},
    { userId: ownUserId } = {}
  ) => {
    if (
      root &&
      root.username &&
      root.services &&
      root.emails &&
      !foreignUserId
    ) {
      return root._id === ownUserId;
    }
    return foreignUserId === ownUserId || !foreignUserId;
  };

  const isOwnedEmailAddress = (root, { email } = {}, { user } = {}) => {
    return user?.emails?.some(
      (emailRecord) => emailRecord.address.toLowerCase() === email.toLowerCase()
    );
  };

  const isOwnedOrder = (root, { orderId }, { userId }) => {
    const order = Orders.findOrder(
      { orderId },
      {
        fields: {
          userId: true,
        },
      }
    );
    if (!order) return true;
    return order.userId === userId;
  };

  const isOwnedOrderOrCart = (root, { orderId }, { userId }) => {
    if (orderId) {
      return isOwnedOrder(null, { orderId }, { userId });
    }
    return true;
  };

  const isOwnedSubscription = (root, { subscriptionId }, { userId }) => {
    const subscription = Subscriptions.findSubscription(
      { subscriptionId },
      {
        fields: {
          userId: true,
        },
      }
    );
    if (!subscription) return true;
    return subscription.userId === userId;
  };

  const isOwnedOrderPayment = (root, { orderPaymentId }, { userId }) => {
    const payment = OrderPayments.findPayment(
      { orderPaymentId },
      {
        fields: {
          orderId: true,
        },
      }
    );
    // return true if db entity not found in order
    // to let the resolver throw a good exception
    if (!payment) return true;
    const orderId = payment && payment.orderId;
    return isOwnedOrder(null, { orderId }, { userId });
  };

  const isOwnedOrderDelivery = (root, { orderDeliveryId }, { userId }) => {
    const delivery = OrderDeliveries.findDelivery(
      { orderDeliveryId },
      {
        fields: {
          orderId: true,
        },
      }
    );
    // return true if db entity not found in order
    // to let the resolver throw a good exception
    if (!delivery) return true;
    const orderId = delivery && delivery.orderId;
    return isOwnedOrder(null, { orderId }, { userId });
  };

  const isOwnedOrderItem = (root, { itemId }, { userId }) => {
    const item = OrderPositions.findItem(
      { itemId },
      {
        fields: {
          orderId: true,
        },
      }
    );
    // return true if db entity not found in order
    // to let the resolver throw a good exception
    if (!item) return true;
    const orderId = item && item.orderId;
    return isOwnedOrder(null, { orderId }, { userId });
  };

  const isOwnedOrderDiscount = (root, { discountId }, { userId }) => {
    const discount = OrderDiscounts.findDiscount(
      { discountId },
      {
        fields: {
          orderId: true,
        },
      }
    );
    // return true if db entity not found in order
    // to let the resolver throw a good exception
    if (!discount) return true;
    const orderId = discount && discount.orderId;
    return isOwnedOrder(null, { orderId }, { userId });
  };

  const isOwnedProductReview = (root, { productReviewId }, { userId }) => {
    const review = ProductReviews.findReview({ productReviewId });
    if (!review) return true;
    return review.userId === userId;
  };

  const isOwnedQuotation = (root, { quotationId }, { userId }) => {
    const quotation = Quotations.findQuotation(
      { quotationId },
      {
        fields: {
          userId: true,
        },
      }
    );
    // return true if db entity not found in order
    // to let the resolver throw a good exception
    if (!quotation) return true;
    return quotation.userId === userId;
  };

  const isOwnedBookmark = (root, { bookmarkId }, { userId, modules }) => {
    const bookmark = Promise.await(modules.bookmarks.findById(bookmarkId));
    // return true if db entity not found in order
    // to let the resolver throw a good exception
    if (!bookmark) return true;
    return bookmark.userId === userId;
  };

  const isOwnedPaymentCredential = (
    root,
    { paymentCredentialsId },
    { userId }
  ) => {
    const credentials = PaymentCredentials.findCredentials(
      {
        paymentCredentialsId,
      },
      {
        fields: {
          userId: true,
        },
      }
    );
    // return true if db entity not found in order
    // to let the resolver throw a good exception
    if (!credentials) return true;
    return credentials.userId === userId;
  };
  role.allow(actions.viewEvent, false);
  role.allow(actions.viewEvents, false);
  role.allow(actions.viewUser, isMyself);
  role.allow(actions.viewUserRoles, isMyself);
  role.allow(actions.viewUserOrders, isMyself);
  role.allow(actions.viewUserQuotations, isMyself);
  role.allow(actions.viewUserSubscriptions, isMyself);
  role.allow(actions.viewUserPrivateInfos, isMyself);
  role.allow(actions.updateUser, isMyself);
  role.allow(actions.sendEmail, isOwnedEmailAddress);
  role.allow(actions.viewOrder, isOwnedOrder);
  role.allow(actions.updateOrder, isOwnedOrder);
  role.allow(actions.updateOrderItem, isOwnedOrderItem);
  role.allow(actions.updateOrderDiscount, isOwnedOrderDiscount);
  role.allow(actions.updateOrderDelivery, isOwnedOrderDelivery);
  role.allow(actions.updateOrderPayment, isOwnedOrderPayment);
  role.allow(actions.checkoutCart, isOwnedOrderOrCart);
  role.allow(actions.updateCart, isOwnedOrderOrCart);
  role.allow(actions.createCart, () => true);
  role.allow(actions.viewSubscription, isOwnedSubscription);
  role.allow(actions.updateSubscription, isOwnedSubscription);
  role.allow(actions.createSubscription, () => true);
  role.allow(actions.reviewProduct, () => true);
  role.allow(actions.updateProductReview, isOwnedProductReview);
  role.allow(actions.requestQuotation, () => true);
  role.allow(actions.answerQuotation, isOwnedQuotation);
  role.allow(actions.manageBookmarks, isOwnedBookmark);
  role.allow(actions.bookmarkProduct, () => true);
  role.allow(actions.voteProductReview, () => true);
  role.allow(actions.registerPaymentCredentials, () => true);
  role.allow(actions.managePaymentCredentials, isOwnedPaymentCredential);
};
