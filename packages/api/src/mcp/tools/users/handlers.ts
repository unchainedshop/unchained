import { ActionName, Handler } from './schemas.js';

const actionHandlers: { [K in ActionName]: Handler<K> } = {
  LIST: async (usersModule, params) => {
    const {
      limit = 20,
      offset = 0,
      includeGuests = false,
      queryString,
      sort,
      emailVerified,
      lastLogin,
    } = params;

    const users = await usersModule.list({
      limit,
      offset,
      includeGuests,
      queryString,
      sort,
      emailVerified,
      lastLogin,
    });

    return { users };
  },

  COUNT: async (usersModule, params) => {
    const {
      includeGuests = false,
      queryString,
      emailVerified,
      lastLogin,
    } = params;

    const count = await usersModule.count({
      includeGuests,
      queryString,
      emailVerified,
      lastLogin,
    });

    return { count };
  },

  GET: async (usersModule, params) => {
    const { userId } = params;
    const user = await usersModule.get({ userId });
    return { user };
  },

  CREATE: async (usersModule, params) => {
    const { username, email, password, profile } = params;
    const userId = await usersModule.create({
      username,
      email,
      password,
      profile,
    });
    const user = await usersModule.get({ userId });
    return { user, userId };
  },

  UPDATE: async (usersModule, params) => {
    const { userId, profile, meta } = params;
    const user = await usersModule.update({
      userId,
      profile,
      meta,
    });
    return { user };
  },

  REMOVE: async (usersModule, params) => {
    const { userId, removeUserReviews } = params;
    const user = await usersModule.remove({
      userId,
      removeUserReviews,
    });
    return { user };
  },

  ENROLL: async (usersModule, params) => {
    const { email, profile, password } = params;
    const user = await usersModule.enroll({
      email,
      profile,
      password,
    });
    return { user };
  },

  SET_ROLES: async (usersModule, params) => {
    const { userId, roles } = params;
    const user = await usersModule.setRoles({ userId, roles });
    return { user };
  },

  SET_TAGS: async (usersModule, params) => {
    const { userId, tags } = params;
    const user = await usersModule.setTags({ userId, tags });
    return { user };
  },

  SET_PASSWORD: async (usersModule, params) => {
    const { userId, newPassword } = params;
    const user = await usersModule.setPassword({ userId, newPassword });
    return { user };
  },

  SET_USERNAME: async (usersModule, params) => {
    const { userId, username } = params;
    await usersModule.setUsername({ userId, username });
    const user = await usersModule.get({ userId });
    return { user };
  },

  ADD_EMAIL: async (usersModule, params) => {
    const { userId, email } = params;
    const user = await usersModule.addEmail({ userId, email });
    return { user };
  },

  REMOVE_EMAIL: async (usersModule, params) => {
    const { userId, email } = params;
    const user = await usersModule.removeEmail({ userId, email });
    return { user };
  },

  SEND_ENROLLMENT_EMAIL: async (usersModule, params) => {
    const { email } = params;
    const result = await usersModule.sendEnrollmentEmail({ email });
    return { result };
  },

  SEND_VERIFICATION_EMAIL: async (usersModule, params) => {
    const { email } = params;
    const result = await usersModule.sendVerificationEmail({ email });
    return { result };
  },

  REMOVE_PRODUCT_REVIEWS: async (usersModule, params) => {
    const { userId } = params;
    const result = await usersModule.removeProductReviews({ userId });
    return { result };
  },

  GET_ORDERS: async (usersModule, params) => {
    const {
      userId,
      limit = 10,
      offset = 0,
      includeCarts = false,
      sort,
      queryString,
      status,
    } = params;

    const orders = await usersModule.getOrders({
      userId,
      limit,
      offset,
      includeCarts,
      sort,
      queryString,
      status,
    });

    return { orders };
  },

  GET_ENROLLMENTS: async (usersModule, params) => {
    const {
      userId,
      limit = 10,
      offset = 0,
      sort,
      queryString,
      status,
    } = params;

    const enrollments = await usersModule.getEnrollments({
      userId,
      limit,
      offset,
      sort,
      queryString,
      status,
    });

    return { enrollments };
  },

  GET_QUOTATIONS: async (usersModule, params) => {
    const {
      userId,
      limit = 10,
      offset = 0,
      sort,
      queryString,
    } = params;

    const quotations = await usersModule.getQuotations({
      userId,
      limit,
      offset,
      sort,
      queryString,
    });

    return { quotations };
  },

  GET_BOOKMARKS: async (usersModule, params) => {
    const { userId } = params;
    const bookmarks = await usersModule.getBookmarks({ userId });
    return { bookmarks };
  },

  GET_PAYMENT_CREDENTIALS: async (usersModule, params) => {
    const { userId } = params;
    const paymentCredentials = await usersModule.getPaymentCredentials({ userId });
    return { paymentCredentials };
  },

  GET_AVATAR: async (usersModule, params) => {
    const { userId } = params;
    const avatar = await usersModule.getAvatar({ userId });
    return { avatar };
  },

  GET_REVIEWS: async (usersModule, params) => {
    const {
      userId,
      limit = 10,
      offset = 0,
      sort,
    } = params;

    const reviews = await usersModule.getReviews({
      userId,
      limit,
      offset,
      sort,
    });

    return { reviews };
  },

  GET_REVIEWS_COUNT: async (usersModule, params) => {
    const { userId } = params;
    const count = await usersModule.getReviewsCount({ userId });
    return { count };
  },
};

export default actionHandlers;