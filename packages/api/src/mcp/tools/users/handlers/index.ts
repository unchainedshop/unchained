import listUsers from './listUsers.ts';
import countUsers from './countUsers.ts';
import getUser from './getUser.ts';
import createUser from './createUser.ts';
import updateUser from './updateUser.ts';
import removeUser from './removeUser.ts';
import enrollUser from './enrollUser.ts';
import setUserTags from './setUserTags.ts';
import setUserUsername from './setUserUsername.ts';
import addUserEmail from './addUserEmail.ts';
import removeUserEmail from './removeUserEmail.ts';
import sendEnrollmentEmail from './sendEnrollmentEmail.ts';
import sendVerificationEmail from './sendVerificationEmail.ts';
import removeProductReviews from './removeProductReviews.ts';
import getUserOrders from './getUserOrders.ts';
import getUserEnrollments from './getUserEnrollments.ts';
import getUserQuotations from './getUserQuotations.ts';
import getUserBookmarks from './getUserBookmarks.ts';
import getUserPaymentCredentials from './getUserPaymentCredentials.ts';
import getUserAvatar from './getUserAvatar.ts';
import getUserReviews from './getUserReviews.ts';
import getUserReviewsCount from './getUserReviewsCount.ts';
import getCurrentUser from './getCurrentUser.ts';

export default {
  LIST: listUsers,
  COUNT: countUsers,
  GET: getUser,
  CREATE: createUser,
  UPDATE: updateUser,
  REMOVE: removeUser,
  ENROLL: enrollUser,
  SET_TAGS: setUserTags,
  SET_USERNAME: setUserUsername,
  ADD_EMAIL: addUserEmail,
  REMOVE_EMAIL: removeUserEmail,
  SEND_ENROLLMENT_EMAIL: sendEnrollmentEmail,
  SEND_VERIFICATION_EMAIL: sendVerificationEmail,
  REMOVE_PRODUCT_REVIEWS: removeProductReviews,
  GET_ORDERS: getUserOrders,
  GET_ENROLLMENTS: getUserEnrollments,
  GET_QUOTATIONS: getUserQuotations,
  GET_BOOKMARKS: getUserBookmarks,
  GET_PAYMENT_CREDENTIALS: getUserPaymentCredentials,
  GET_AVATAR: getUserAvatar,
  GET_REVIEWS: getUserReviews,
  GET_REVIEWS_COUNT: getUserReviewsCount,
  GET_CURRENT_USER: getCurrentUser,
};
