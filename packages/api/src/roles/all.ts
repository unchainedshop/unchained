import { Context } from '../context.js';

export const all = (role, actions) => {
  const isInLoginMutationResponse = (root) => {
    if (root && root._inLoginMethodResponse) {
      return true;
    }
    return false;
  };

  const isOwnedToken = async (root: any, params: { tokenId: string } | null, context: Context) => {
    const { modules, userId, user } = context;

    const tokenId = params?.tokenId || (root && 'chainTokenId' in root && root._id) || null;

    const token = await modules.warehousing.findToken({ tokenId });
    if (!token) return true;

    const isOwnedByUser =
      token.userId === userId ||
      user?.services?.web3?.some((service) => {
        return service.address === token.walletAddress && service.verified;
      });

    if (isOwnedByUser) return true;

    const accessKeyHeader = context.getHeader('x-token-accesskey');
    const accessKey = await context.modules.warehousing.buildAccessKeyForToken(tokenId);
    if (accessKeyHeader === accessKey) return true;

    return false;
  };

  const isUsersCollectionEmpty = async (_: never, params: never, context: Context) => {
    const count = await context.modules.users.count({
      includeDeleted: true,
      includeGuests: true,
    });
    if (count === 0) return true;
    return false;
  };

  const isFilePublic = async (file) => {
    // Non private files or no files always resolve to true
    if (!file?.meta?.isPrivate) return true;
    return false;
  };

  role.allow(actions.viewEvent, () => false);
  role.allow(actions.viewEvents, () => false);
  role.allow(actions.viewUser, () => false);
  role.allow(actions.viewUsers, () => false);
  role.allow(actions.viewUsersCount, isUsersCollectionEmpty);
  role.allow(actions.viewPaymentProviders, () => false);
  role.allow(actions.viewPaymentProvider, () => false);
  role.allow(actions.viewPaymentInterfaces, () => false);
  role.allow(actions.viewDeliveryProviders, () => false);
  role.allow(actions.viewDeliveryProvider, () => false);
  role.allow(actions.viewDeliveryInterfaces, () => false);
  role.allow(actions.viewWarehousingProviders, () => false);
  role.allow(actions.viewWarehousingProvider, () => false);
  role.allow(actions.viewWarehousingInterfaces, () => false);
  role.allow(actions.viewOrders, () => false);
  role.allow(actions.sendEmail, () => false);
  role.allow(actions.updateUser, () => false);
  role.allow(actions.updateUsername, () => false);
  role.allow(actions.manageLanguages, () => false);
  role.allow(actions.manageCountries, () => false);
  role.allow(actions.manageProducts, () => false);
  role.allow(actions.manageCurrencies, () => false);
  role.allow(actions.managePaymentProviders, () => false);
  role.allow(actions.manageDeliveryProviders, () => false);
  role.allow(actions.manageWarehousingProviders, () => false);
  role.allow(actions.manageAssortments, () => false);
  role.allow(actions.manageFilters, () => false);
  role.allow(actions.manageUsers, () => false);
  role.allow(actions.updateCart, () => false);
  role.allow(actions.createCart, () => false);
  role.allow(actions.checkoutCart, () => false);
  role.allow(actions.updateOrder, () => false);
  role.allow(actions.updateOrderDiscount, () => false);
  role.allow(actions.updateOrderItem, () => false);
  role.allow(actions.updateOrderDelivery, () => false);
  role.allow(actions.updateOrderPayment, () => false);
  role.allow(actions.markOrderConfirmed, () => false);
  role.allow(actions.confirmMediaUpload, () => false);
  role.allow(actions.markOrderRejected, () => false);
  role.allow(actions.markOrderPaid, () => false);
  role.allow(actions.markOrderDelivered, () => false);
  role.allow(actions.reviewProduct, () => false);
  role.allow(actions.updateProductReview, () => false);
  role.allow(actions.manageProductReviews, () => false);
  role.allow(actions.requestQuotation, () => false);
  role.allow(actions.viewQuotations, () => false);
  role.allow(actions.manageQuotations, () => false);
  role.allow(actions.answerQuotation, () => false);
  role.allow(actions.manageBookmarks, () => false);
  role.allow(actions.bookmarkProduct, () => false);
  role.allow(actions.voteProductReview, () => false);
  role.allow(actions.manageWorker, () => false);
  role.allow(actions.viewEnrollment, () => false);
  role.allow(actions.viewEnrollments, () => false);
  role.allow(actions.updateEnrollment, () => false);
  role.allow(actions.createEnrollment, () => false);
  role.allow(actions.registerPaymentCredentials, () => false);
  role.allow(actions.managePaymentCredentials, () => false);
  role.allow(actions.bulkImport, () => false);
  role.allow(actions.viewOrder, () => false);
  role.allow(actions.viewQuotation, () => false);
  role.allow(actions.viewEnrollment, () => false);
  role.allow(actions.viewTokens, () => false);
  role.allow(actions.viewStatistics, () => false);
  role.allow(actions.uploadUserAvatar, () => false);
  role.allow(actions.uploadTempFile, () => false);
  role.allow(actions.impersonate, () => false);

  // special case: when doing a login mutation, the user is not logged in technically yet,
  // but should be able to see user data of the user that is about to be logged in
  role.allow(actions.viewLogs, isInLoginMutationResponse);
  role.allow(actions.viewUserRoles, isInLoginMutationResponse);
  role.allow(actions.viewUserOrders, isInLoginMutationResponse);
  role.allow(actions.viewUserTokens, isInLoginMutationResponse);
  role.allow(actions.viewUserQuotations, isInLoginMutationResponse);
  role.allow(actions.viewUserPrivateInfos, isInLoginMutationResponse);
  role.allow(actions.viewUserEnrollments, isInLoginMutationResponse);
  role.allow(actions.viewUserProductReviews, isInLoginMutationResponse);

  // special case: access to token sometimes works via a X-Token-AccessKey Header and thus should also be allowed for anonymous users
  role.allow(actions.updateToken, isOwnedToken);
  role.allow(actions.viewToken, isOwnedToken);

  // special case: access to file downloads should work when meta.isPrivate is not set
  role.allow(actions.downloadFile, isFilePublic);

  // only allow if query is not demanding for drafts or inactive item lists
  role.allow(actions.viewProducts, (root, { includeDrafts }) => !includeDrafts);
  role.allow(actions.viewAssortments, (root, { includeInactive }) => !includeInactive);
  role.allow(actions.viewCountries, (root, { includeInactive }) => !includeInactive);
  role.allow(actions.viewCurrencies, (root, { includeInactive }) => !includeInactive);
  role.allow(actions.viewFilters, (root, { includeInactive }) => !includeInactive);
  role.allow(actions.viewLanguages, (root, { includeInactive }) => !includeInactive);
  role.allow(actions.search, (root, { includeInactive }) => !includeInactive);

  // public
  role.allow(actions.viewUserPublicInfos, () => true);
  role.allow(actions.viewProduct, () => true);
  role.allow(actions.viewLanguage, () => true);
  role.allow(actions.viewCountry, () => true);
  role.allow(actions.viewCurrency, () => true);
  role.allow(actions.viewShopInfo, () => true);
  role.allow(actions.viewAssortment, () => true);
  role.allow(actions.viewFilter, () => true);
  role.allow(actions.viewTranslations, () => true);
  role.allow(actions.logout, () => true);
  role.allow(actions.stopImpersonation, () => true);
  role.allow(actions.loginAsGuest, () => true);
  role.allow(actions.loginWithPassword, () => true);
  role.allow(actions.loginWithWebAuthn, () => true);
  role.allow(actions.verifyEmail, () => true);
  role.allow(actions.useWebAuthn, () => true);
  role.allow(actions.pageView, () => true);
  role.allow(actions.createUser, () => true);
  role.allow(actions.forgotPassword, () => true);
  role.allow(actions.resetPassword, () => true);
  role.allow(actions.changePassword, () => true);
  role.allow(actions.heartbeat, () => true);
};
