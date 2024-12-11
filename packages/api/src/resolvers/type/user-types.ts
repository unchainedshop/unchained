import { Bookmark } from '@unchainedshop/core-bookmarks';
import { SortOption } from '@unchainedshop/utils';
import { Enrollment, EnrollmentStatus } from '@unchainedshop/core-enrollments';
import { File } from '@unchainedshop/core-files';
import { Language } from '@unchainedshop/core-languages';
import { Order, OrderStatus } from '@unchainedshop/core-orders';
import { PaymentCredentials } from '@unchainedshop/core-payment';
import { Quotation } from '@unchainedshop/core-quotations';
import {
  Email,
  User as UserType,
  UserProfile,
  Web3Address,
  WebAuthnCredentials,
  PushSubscription,
} from '@unchainedshop/core-users';
import { TokenSurrogate } from '@unchainedshop/core-warehousing';
import { Roles, permissions } from '@unchainedshop/roles';
import { ProductReview } from '@unchainedshop/core-products';
import { checkAction, checkTypeResolver } from '../../acl.js';
import { actions } from '../../roles/index.js';
import { Context } from '../../context.js';
import { Contact } from '@unchainedshop/mongodb';
import { Country } from '@unchainedshop/core-countries';

type HelperType<P, T> = (user: UserType, params: P, context: Context) => Promise<T>;

export interface UserHelperTypes {
  _id: HelperType<any, boolean>;
  created: HelperType<any, Date>;
  updated: HelperType<any, Date>;
  deleted: HelperType<any, Date>;
  avatar: HelperType<{ localeContext: Intl.Locale }, File>;
  bookmarks: HelperType<any, Array<Bookmark>>;
  cart: HelperType<{ orderNumber?: string }, Order>;
  country: HelperType<{ localeContext: Intl.Locale }, Country>;
  emails: HelperType<any, Array<string>>;
  enrollments: HelperType<
    {
      sort?: Array<SortOption>;
      queryString?: string;
      limit?: number;
      offset?: number;
      status?: Array<EnrollmentStatus>;
    },
    Array<Enrollment>
  >;
  isGuest: HelperType<any, boolean>;
  isInitialPassword: HelperType<any, boolean>;
  language: HelperType<{ localeContext: Intl.Locale }, Language>;
  lastBillingAddress: HelperType<any, UserType['lastBillingAddress']>;
  lastContact: HelperType<any, Contact>;
  lastLogin: HelperType<any, UserType['lastLogin']>;
  allowedActions: HelperType<any, Array<string>>;
  name: HelperType<any, string>;
  orders: HelperType<
    {
      includeCarts: boolean;
      sort?: Array<SortOption>;
      queryString?: string;
      status?: OrderStatus[];
      userId?: string;
      limit?: number;
      offset?: number;
    },
    Array<Order>
  >;
  paymentCredentials: HelperType<any, Array<PaymentCredentials>>;
  tokens: HelperType<any, Array<TokenSurrogate>>;
  webAuthnCredentials: HelperType<any, Array<WebAuthnCredentials>>;
  web3Addresses: HelperType<any, Array<Web3Address>>;
  primaryEmail: HelperType<any, Email>;
  profile: HelperType<any, UserProfile>;
  quotations: HelperType<
    { sort?: Array<SortOption>; queryString?: string; userId?: string; limit?: number; offset?: number },
    Array<Quotation>
  >;
  roles: HelperType<any, Array<string>>;
  tags: HelperType<any, Array<string>>;
  username: HelperType<any, string>;
  pushSubscriptions: HelperType<any, Array<PushSubscription>>;
  reviews: HelperType<
    {
      sort?: Array<SortOption>;
      limit?: number;
      offset?: number;
    },
    Array<ProductReview>
  >;
  reviewsCount: HelperType<any, number>;
}

const {
  viewUserPrivateInfos,
  viewUserPublicInfos,
  viewUserOrders,
  viewUserEnrollments,
  viewUserQuotations,
  viewUserProductReviews,
} = actions as Record<string, string>;

const getPrimaryEmail = (user: UserType) => {
  return (user.emails || []).sort((left, right) => Number(right.verified) - Number(left.verified))?.[0];
};

export const User: UserHelperTypes = {
  _id: checkTypeResolver(viewUserPublicInfos, '_id'),
  created: checkTypeResolver(viewUserPrivateInfos, 'created'),
  updated: checkTypeResolver(viewUserPrivateInfos, 'updated'),
  deleted: checkTypeResolver(viewUserPrivateInfos, 'deleted'),
  emails: checkTypeResolver(viewUserPrivateInfos, 'emails'),
  lastBillingAddress: checkTypeResolver(viewUserPrivateInfos, 'lastBillingAddress'),
  lastContact: checkTypeResolver(viewUserPrivateInfos, 'lastContact'),
  lastLogin: checkTypeResolver(viewUserPrivateInfos, 'lastLogin'),
  profile: checkTypeResolver(viewUserPrivateInfos, 'profile'),
  roles: checkTypeResolver(viewUserPrivateInfos, 'roles'),
  tags: checkTypeResolver(viewUserPrivateInfos, 'tags'),
  username: checkTypeResolver(viewUserPrivateInfos, 'username'),

  name: async (user, params, context) => {
    await checkAction(context, viewUserPublicInfos, [user, params]);

    const { profile } = user;
    if (profile && profile.displayName && profile.displayName !== '') return profile.displayName;

    const primaryEmail = getPrimaryEmail(user);
    return primaryEmail?.address || user._id;
  },

  primaryEmail: async (user, params, context) => {
    await checkAction(context, viewUserPrivateInfos, [user, params]);
    return getPrimaryEmail(user);
  },

  isInitialPassword: async (user, params, context) => {
    await checkAction(context, viewUserPrivateInfos, [user, params]);
    const { password: { initial } = { initial: undefined } } = user.services || {};
    return user.initialPassword || !!initial;
  },

  isGuest: async (user, params, context) => {
    await checkAction(context, viewUserPrivateInfos, [user, params]);
    return !!user.guest;
  },

  avatar: async (user, params, context) => {
    await checkAction(context, viewUserPublicInfos, [user, params]);
    const { loaders } = context;
    return loaders.fileLoader.load({
      fileId: user.avatarId,
    });
  },

  bookmarks: async (user, params, context) => {
    await checkAction(context, viewUserPrivateInfos, [user, params]);
    return context.modules.bookmarks.findBookmarksByUserId(user._id);
  },

  async cart(user, params, context) {
    const { modules, countryContext } = context;
    await checkAction(context, viewUserOrders, [user, params]);
    return modules.orders.cart({
      countryContext: countryContext || user.lastLogin?.countryCode,
      orderNumber: params.orderNumber,
      userId: user._id,
    });
  },

  async tokens(user, params, context) {
    await checkAction(context, viewUserPrivateInfos, [user, params]);
    const walletAddresses =
      user.services?.web3?.flatMap((service) => {
        return service.verified ? [service.address] : [];
      }) || [];
    return context.modules.warehousing.findTokensForUser({
      userId: user._id,
      walletAddresses,
    });
  },

  async country(user, params, context) {
    await checkAction(context, viewUserPrivateInfos, [user, params]);
    const userLocale = context.modules.users.userLocale(user);
    return context.modules.countries.findCountry({
      isoCode: userLocale.region?.toUpperCase(),
    });
  },

  async enrollments(user, params, context) {
    await checkAction(context, viewUserEnrollments, [user, params]);
    return context.modules.enrollments.findEnrollments({
      ...(params || {}),
      userId: user._id,
    });
  },

  language: async (user, params, context) => {
    await checkAction(context, viewUserPrivateInfos, [user, params]);
    const userLocale = context.modules.users.userLocale(user);
    return context.modules.languages.findLanguage({
      isoCode: userLocale.language,
    });
  },

  allowedActions: async (user, params, context) => {
    await checkAction(context, viewUserPrivateInfos, [user, params]);

    const userRoles = Roles.getUserRoles(user?._id, user.roles, true);
    return permissions(userRoles, context.roles) as Promise<string[]>;
  },

  orders: async (user, params, context) => {
    await checkAction(context, viewUserOrders, [user, params]);
    return context.modules.orders.findOrders({
      ...(params || {}),
      userId: user._id,
    });
  },

  paymentCredentials: async (user, params, context) => {
    await checkAction(context, viewUserPrivateInfos, [user, params]);
    return context.modules.payment.paymentCredentials.findPaymentCredentials(
      { ...params.selector, userId: user._id },
      {
        sort: {
          created: -1,
        },
      },
    );
  },

  webAuthnCredentials: async (user, params, context) => {
    await checkAction(context, viewUserPrivateInfos, [user, params]);
    return user.services?.webAuthn || [];
  },

  web3Addresses: async (user, params, context) => {
    await checkAction(context, viewUserPrivateInfos, [user, params]);
    return user.services?.web3 || [];
  },
  quotations: async (user, params, context) => {
    await checkAction(context, viewUserQuotations, [user, params]);
    return context.modules.quotations.findQuotations({
      ...(params || {}),
      userId: user._id,
    });
  },
  pushSubscriptions: async (user, _, context) => {
    await checkAction(context, viewUserPrivateInfos, [user]);
    return (user?.pushSubscriptions || []).map(({ keys, userAgent, expirationTime, endpoint }) => ({
      _id: keys.p256dh,
      userAgent,
      expirationTime,
      endpoint,
    }));
  },
  async reviews(user, params, context) {
    const { modules } = context;
    await checkAction(context, viewUserProductReviews, [user, params]);
    return modules.products.reviews.findProductReviews({
      ...(params || {}),
      authorId: user._id,
    });
  },
  async reviewsCount(user, params, context) {
    const { modules } = context;
    await checkAction(context, viewUserProductReviews, [user, params]);
    return modules.products.reviews.count({
      authorId: user._id,
    });
  },
};
