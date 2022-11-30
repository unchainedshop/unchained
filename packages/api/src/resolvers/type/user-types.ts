import { Context, SortOption } from '@unchainedshop/types/api';
import { Bookmark } from '@unchainedshop/types/bookmarks';
import { Contact } from '@unchainedshop/types/common';
import { Country } from '@unchainedshop/types/countries';
import { Enrollment } from '@unchainedshop/types/enrollments';
import { File } from '@unchainedshop/types/files';
import { Language } from '@unchainedshop/types/languages';
import { Order } from '@unchainedshop/types/orders';
import { PaymentCredentials } from '@unchainedshop/types/payments';
import { Quotation } from '@unchainedshop/types/quotations';
import {
  Email,
  User as UserType,
  UserProfile,
  Web3Address,
  WebAuthnCredentials,
} from '@unchainedshop/types/user';
import type { Locale } from 'locale';
import { TokenSurrogate } from '@unchainedshop/types/warehousing';
import { checkAction, checkTypeResolver } from '../../acl';
import { actions } from '../../roles';

type HelperType<P, T> = (user: UserType, params: P, context: Context) => Promise<T>;

export interface UserHelperTypes {
  _id: HelperType<any, boolean>;
  avatar: HelperType<{ localeContext: Locale }, File>;
  bookmarks: HelperType<any, Array<Bookmark>>;
  cart: HelperType<{ orderNumber?: string }, Order>;
  country: HelperType<{ localeContext: Locale }, Country>;
  emails: HelperType<any, Array<string>>;
  enrollments: HelperType<{ sort?: Array<SortOption>; queryString?: string }, Array<Enrollment>>;
  isGuest: HelperType<any, boolean>;
  isInitialPassword: HelperType<any, boolean>;
  isTwoFactorEnabled: HelperType<any, boolean>;
  language: HelperType<{ localeContext: Locale }, Language>;
  lastBillingAddress: HelperType<any, UserType['lastBillingAddress']>;
  lastContact: HelperType<any, Contact>;
  lastLogin: HelperType<any, UserType['lastLogin']>;
  allowedActions: HelperType<any, Array<string>>;
  // locale: HelperType<{ localeContext: Locale }, Locale>;
  name: HelperType<any, string>;
  orders: HelperType<
    { includeCarts: boolean; sort?: Array<SortOption>; queryString?: string },
    Array<Order>
  >;
  paymentCredentials: HelperType<any, Array<PaymentCredentials>>;
  tokens: HelperType<any, Array<TokenSurrogate>>;
  webAuthnCredentials: HelperType<any, Array<WebAuthnCredentials>>;
  web3Addresses: HelperType<any, Array<Web3Address>>;
  primaryEmail: HelperType<any, Email>;
  profile: HelperType<any, UserProfile>;
  quotations: HelperType<{ sort?: Array<SortOption>; queryString?: string }, Array<Quotation>>;
  roles: HelperType<any, Array<string>>;
  tags: HelperType<any, Array<string>>;
  username: HelperType<any, string>;
}

const {
  viewUserPrivateInfos,
  viewUserPublicInfos,
  viewUserOrders,
  viewUserEnrollments,
  viewUserQuotations,
} = actions as Record<string, string>;

const getPrimaryEmail = (user: UserType) => {
  return (user.emails || []).sort((left, right) => Number(right.verified) - Number(left.verified))?.[0];
};

export const User: UserHelperTypes = {
  _id: checkTypeResolver(viewUserPublicInfos, '_id'),
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
  isTwoFactorEnabled: async (user, params, context) => {
    await checkAction(context, viewUserPrivateInfos, [user, params]);
    const { 'two-factor': { secret } = { secret: undefined } } = user.services || {};
    return !!secret;
  },
  isGuest: async (user, params, context) => {
    await checkAction(context, viewUserPrivateInfos, [user, params]);
    return !!user.guest;
  },

  avatar: async (user, params, context) => {
    await checkAction(context, viewUserPublicInfos, [user, params]);
    return context.modules.files.findFile({
      fileId: user.avatarId as string,
    });
  },

  bookmarks: async (user, params, context) => {
    await checkAction(context, viewUserPrivateInfos, [user, params]);
    return context.modules.bookmarks.findByUserId(user._id);
  },

  async cart(user, params, context) {
    const { modules, countryContext } = context;
    await checkAction(context, viewUserOrders, [user, params]);
    return modules.orders.cart({ countryContext, orderNumber: params.orderNumber }, user);
  },

  async tokens(user, params, context) {
    await checkAction(context, viewUserPrivateInfos, [user, params]);
    return context.modules.warehousing.findTokensForUser(user);
  },

  country: async (user, params, context) => {
    await checkAction(context, viewUserPrivateInfos, [user, params]);
    return context.services.users.getUserCountry(user, params, context);
  },

  enrollments: async (user, params, context) => {
    await checkAction(context, viewUserEnrollments, [user, params]);
    return context.modules.enrollments.findEnrollments({
      userId: user._id,
    });
  },

  language: async (user, params, context) => {
    await checkAction(context, viewUserPrivateInfos, [user, params]);
    return context.services.users.getUserLanguage(user, params, context);
  },

  allowedActions: async (user, params, context) => {
    await checkAction(context, viewUserPrivateInfos, [user, params]);
    return context.services.users.getUserRoleActions(user, context);
  },

  // locale: async (user, params, context) => {
  //   await checkAction(context, viewUserPrivateInfos, [user, params, context]);
  //   return context.modules.users.userLocale(user, params);
  // },

  orders: async (user, params, context) => {
    await checkAction(context, viewUserOrders, [user, params]);
    return context.modules.orders.findOrders({
      userId: user._id,
      includeCarts: params.includeCarts,
      sort: params.sort,
      queryString: params.queryString,
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
      userId: user._id,
      sort: params.sort,
      queryString: params.queryString,
    });
  },
};
