import {
  Orders,
  OrderPayments,
  OrderDeliveries,
  OrderPositions,
  OrderDiscounts
} from 'meteor/unchained:core-orders';
import { ProductReviews } from 'meteor/unchained:core-products';
import { Quotations } from 'meteor/unchained:core-quotations';
import { Bookmarks } from 'meteor/unchained:core-bookmarks';

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

  const isOwnedOrder = (root, { orderId }, { userId }) =>
    Orders.find({
      _id: orderId,
      userId
    }).count() > 0;

  const isOwnedOrderOrCart = (root, { orderId }, { userId }) => {
    if (orderId) {
      return isOwnedOrder(null, { orderId }, { userId });
    }
    return true;
  };

  const isOwnedOrderPayment = (root, { orderPaymentId }, { userId }) => {
    const payment = OrderPayments.findOne({ _id: orderPaymentId });
    const orderId = payment && payment.orderId;
    return isOwnedOrder(null, { orderId }, { userId });
  };

  const isOwnedOrderDelivery = (root, { orderDeliveryId }, { userId }) => {
    const delivery = OrderDeliveries.findOne({ _id: orderDeliveryId });
    const orderId = delivery && delivery.orderId;
    return isOwnedOrder(null, { orderId }, { userId });
  };

  const isOwnedOrderItem = (root, { itemId }, { userId }) => {
    const item = OrderPositions.findOne({ _id: itemId });
    const orderId = item && item.orderId;
    return isOwnedOrder(null, { orderId }, { userId });
  };

  const isOwnedOrderDiscount = (root, { discountId }, { userId }) => {
    const discount = OrderDiscounts.findOne({ _id: discountId });
    const orderId = discount && discount.orderId;
    return isOwnedOrder(null, { orderId }, { userId });
  };

  const isOwnedProductReview = (root, { productReviewId }, { userId }) =>
    ProductReviews.findReviewById(productReviewId).userId === userId;

  const isOwnedQuotation = (root, { quotationId }, { userId }) =>
    Quotations.find({
      _id: quotationId,
      userId
    }).count() > 0;

  const isOwnedBookmark = (root, { bookmarkId }, { userId }) =>
    Bookmarks.find({
      _id: bookmarkId,
      userId
    }).count() > 0;

  role.allow(actions.viewUser, isMyself);
  role.allow(actions.viewUserRoles, isMyself);
  role.allow(actions.viewUserOrders, isMyself);
  role.allow(actions.viewUserQuotations, isMyself);
  role.allow(actions.viewUserPrivateInfos, isMyself);
  role.allow(actions.updateUser, isMyself);
  role.allow(actions.viewOrder, isOwnedOrder);
  role.allow(actions.updateOrder, isOwnedOrder);
  role.allow(actions.updateOrderItem, isOwnedOrderItem);
  role.allow(actions.updateOrderDiscount, isOwnedOrderDiscount);
  role.allow(actions.updateOrderDelivery, isOwnedOrderDelivery);
  role.allow(actions.checkoutCart, isOwnedOrderOrCart);
  role.allow(actions.updateCart, isOwnedOrderOrCart);
  role.allow(actions.createCart, () => true);
  role.allow(actions.reviewProduct, () => true);
  role.allow(actions.updateProductReview, () => isOwnedProductReview);
  role.allow(actions.requestQuotation, () => true);
  role.allow(actions.answerQuotation, () => isOwnedQuotation);
  role.allow(actions.manageBookmarks, () => isOwnedBookmark);
  role.allow(actions.bookmarkProduct, () => true);
};
