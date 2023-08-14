import { Context } from '@unchainedshop/types/api.js';
import { User } from '@unchainedshop/types/user.js';

export const loggedIn = (role: any, actions: Record<string, string>) => {
  const isMyself = (
    user: User,
    foreignUser: { userId?: string } = {},
    ownUser: { userId?: string } = {},
  ) => {
    if (user && user.username && user.services && user.emails && !foreignUser.userId) {
      return user._id === ownUser.userId;
    }
    return foreignUser.userId === ownUser.userId || !foreignUser.userId;
  };

  const isOwnedEmailAddress = (obj: any, params: { email?: string }, { user }: Context) => {
    return user?.emails?.some(
      (emailRecord) => emailRecord.address?.toLowerCase() === params.email?.toLowerCase(),
    );
  };

  const isOwnedOrder = async (obj: any, params: { orderId: string }, { modules, userId }: Context) => {
    const order = await modules.orders.findOrder(
      { orderId: params.orderId },
      {
        projection: {
          userId: 1,
        },
      },
    );
    if (!order) return true;
    return order.userId === userId;
  };

  const isOwnedOrderOrCart = async (obj: any, params: { orderId?: string }, context: Context) => {
    if (params.orderId) {
      return isOwnedOrder(null, { orderId: params.orderId }, context);
    }
    return true;
  };

  const isOwnedEnrollment = async (
    obj: any,
    params: { enrollmentId: string },
    { modules, userId }: Context,
  ) => {
    const enrollment = await modules.enrollments.findEnrollment(
      { enrollmentId: params.enrollmentId },
      {
        projection: {
          userId: 1,
        },
      },
    );
    if (!enrollment) return true;
    return enrollment.userId === userId;
  };

  const isOwnedOrderPayment = async (obj: any, params: { orderPaymentId: string }, context: Context) => {
    const payment = await context.modules.orders.payments.findOrderPayment(
      { orderPaymentId: params.orderPaymentId },
      {
        projection: {
          orderId: 1,
        },
      },
    );
    // return true if db entity not found in order
    // to let the resolver throw a good exception
    if (!payment) return true;
    const orderId = payment?.orderId;
    return isOwnedOrder(null, { orderId }, context);
  };

  const isOwnedOrderDelivery = async (
    obj: any,
    params: { orderDeliveryId: string },
    context: Context,
  ) => {
    const delivery = await context.modules.orders.deliveries.findDelivery(
      { orderDeliveryId: params.orderDeliveryId },
      {
        projection: {
          orderId: 1,
        },
      },
    );
    // return true if db entity not found in order
    // to let the resolver throw a good exception
    if (!delivery) return true;
    const orderId = delivery && delivery.orderId;
    return isOwnedOrder(null, { orderId }, context);
  };

  const isOwnedOrderItem = async (obj: any, params: { itemId: string }, context: Context) => {
    const item = await context.modules.orders.positions.findOrderPosition(
      { itemId: params.itemId },
      {
        projection: {
          orderId: 1,
        },
      },
    );
    // return true if db entity not found in order
    // to let the resolver throw a good exception
    if (!item) return true;
    const orderId = item && item.orderId;
    return isOwnedOrder(null, { orderId }, context);
  };

  const isOwnedOrderDiscount = async (obj: any, params: { discountId: string }, context: Context) => {
    const discount = await context.modules.orders.discounts.findOrderDiscount(
      { discountId: params.discountId },
      {
        projection: {
          orderId: 1,
        },
      },
    );
    // return true if db entity not found in order
    // to let the resolver throw a good exception
    if (!discount) return true;
    const orderId = discount && discount.orderId;
    return isOwnedOrder(null, { orderId }, context);
  };

  const isOwnedProductReview = async (
    obj: any,
    params: { productReviewId: string },
    context: Context,
  ) => {
    const { productReviewId } = params;
    const { modules, userId } = context;
    const review = await modules.products.reviews.findProductReview({
      productReviewId,
    });
    if (!review) return true;
    return review.authorId === userId;
  };

  const isOwnedQuotation = async (
    obj: any,
    { quotationId }: { quotationId: string },
    { modules, userId }: Context,
  ) => {
    const quotation = await modules.quotations.findQuotation(
      { quotationId },
      {
        projection: {
          userId: 1,
        },
      },
    );
    // return true if db entity not found in order
    // to let the resolver throw a good exception
    if (!quotation) return true;
    return quotation.userId === userId;
  };

  const isOwnedBookmark = async (
    obj: any,
    { bookmarkId }: { bookmarkId: string },
    { userId, modules }: Context,
  ) => {
    const bookmark = await modules.bookmarks.findBookmarkById(bookmarkId);
    // return true if db entity not found in order
    // to let the resolver throw a good exception
    if (!bookmark) return true;
    return bookmark.userId === userId;
  };

  const isOwnedPaymentCredential = async (
    obj: any,
    { paymentCredentialsId }: { paymentCredentialsId: string },
    { modules, userId }: Context,
  ) => {
    const credentials = await modules.payment.paymentCredentials.findPaymentCredential(
      {
        paymentCredentialsId,
      },
      {
        projection: {
          userId: 1,
        },
      },
    );
    // return true if db entity not found in order
    // to let the resolver throw a good exception
    if (!credentials) return true;
    return credentials.userId === userId;
  };

  const isOwnedToken = async (
    obj: any,
    { tokenId }: { tokenId: string },
    { modules, userId, user }: Context,
  ) => {
    const token = await modules.warehousing.findToken({ tokenId });
    if (!token) return true;
    return (
      token.userId === userId ||
      user?.services?.web3?.some((service) => {
        return service.address === token.walletAddress && service.verified;
      })
    );
  };

  role.allow(actions.viewEvent, false);
  role.allow(actions.viewEvents, false);
  role.allow(actions.viewUser, isMyself);
  role.allow(actions.viewUserRoles, isMyself);
  role.allow(actions.viewUserOrders, isMyself);
  role.allow(actions.viewUserQuotations, isMyself);
  role.allow(actions.viewUserEnrollments, isMyself);
  role.allow(actions.viewUserPrivateInfos, isMyself);
  role.allow(actions.viewUserProductReviews, isMyself);
  role.allow(actions.viewUserTokens, isMyself);
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
  role.allow(actions.updateToken, isOwnedToken);
  role.allow(actions.viewToken, isOwnedToken);
  role.allow(actions.stopImpersonation, () => true);
  role.allow(actions.impersonate, () => false);
};
