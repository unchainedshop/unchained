import listUsers from './listUsers.js';
import countUsers from './countUsers.js';
import getUser from './getUser.js';
import createUser from './createUser.js';
import updateUser from './updateUser.js';
import removeUser from './removeUser.js';
import enrollUser from './enrollUser.js';
import setUserTags from './setUserTags.js';
import setUserUsername from './setUserUsername.js';
import addUserEmail from './addUserEmail.js';
import removeUserEmail from './removeUserEmail.js';
import sendEnrollmentEmail from './sendEnrollmentEmail.js';
import sendVerificationEmail from './sendVerificationEmail.js';
import removeProductReviews from './removeProductReviews.js';
import getUserOrders from './getUserOrders.js';
import getUserEnrollments from './getUserEnrollments.js';
import getUserQuotations from './getUserQuotations.js';
import getUserBookmarks from './getUserBookmarks.js';
import getUserPaymentCredentials from './getUserPaymentCredentials.js';
import getUserAvatar from './getUserAvatar.js';
import getUserReviews from './getUserReviews.js';
import getUserReviewsCount from './getUserReviewsCount.js';
import getCurrentUser from './getCurrentUser.js';

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
