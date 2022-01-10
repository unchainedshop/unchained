import {
  Orders,
  OrderPayments,
  OrderDeliveries,
  OrderPositions,
  OrderDiscounts,
} from 'meteor/unchained:core-orders';
import { ProductReviews } from 'meteor/unchained:core-products';
import { Quotations } from 'meteor/unchained:core-quotations';
import { Enrollments } from 'meteor/unchained:core-enrollments';
import { PaymentCredentials } from 'meteor/unchained:core-payment';
import { Promise } from 'meteor/promise';

export default (role, actions) => {
  const isMyself = (
    root: Root,
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
      (emailRecord) =>
        emailRecord.address?.toLowerCase() === email?.toLowerCase()
    );
  };

  const isOwnedOrder = async (root, { orderId }, { modules, userId }) => {
    const order = await modules.orders.findOrder(
      { orderId },
      {
        projection: {
          userId: true,
        },
      }
    );
    if (!order) return true;
    return order.userId === userId;
  };

  const isOwnedOrderOrCart = async (root, { orderId }, context) => {
    if (orderId) {
      return await isOwnedOrder(null, { orderId }, context);
    }
    return true;
  };

  const isOwnedEnrollment = (root, { enrollmentId }, { userId }) => {
    const enrollment = Enrollments.findEnrollment(
      { enrollmentId },
      {
        fields: {
          userId: true,
        },
      }
    );
    if (!enrollment) return true;
    return enrollment.userId === userId;
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
    root: Root,
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
  role.allow(actions.viewUserEnrollments, isMyself);
  role.allow(actions.viewUserPrivateInfos, isMyself);
  role.allow(actions.updateUser, isMyself);
  role.allow(actions.authTwoFactor, isMyself);
  role.allow(actions.manageTwoFactor, isMyself);

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
  role.allow(actions.viewEnrollment, isOwnedEnrollment);
  role.allow(actions.updateEnrollment, isOwnedEnrollment);
  role.allow(actions.createEnrollment, () => true);
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
