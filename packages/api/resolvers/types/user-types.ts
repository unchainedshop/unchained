import { Context } from '@unchainedshop/types/api';
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
} from '@unchainedshop/types/user';
import { Locale } from 'locale';
import { log, LogLevel } from 'meteor/unchained:logger';
import { checkAction, checkTypeResolver } from '../../acl';
import { actions } from '../../roles';

type HelperType<P, T> = (
  user: UserType,
  params: P,
  context: Context
) => Promise<T>;

export interface UserHelperTypes {
  _id: HelperType<any, boolean>;
  avatar: HelperType<{ localeContext: Locale }, File>;
  bookmarks: HelperType<any, Array<Bookmark>>;
  cart: HelperType<{ orderNumber?: string }, Order>;
  country: HelperType<{ localeContext: Locale }, Country>;
  email: HelperType<any, string>;
  emails: HelperType<any, Array<string>>;
  enrollments: HelperType<any, Array<Enrollment>>;
  isEmailVerified: HelperType<any, boolean>;
  isGuest: HelperType<any, boolean>;
  isInitialPassword: HelperType<any, boolean>;
  isTwoFactorEnabled: HelperType<any, boolean>;
  language: HelperType<{ localeContext: Locale }, Language>;
  lastBillingAddress: HelperType<any, UserType['lastBillingAddress']>;
  lastContact: HelperType<any, Contact>;
  lastLogin: HelperType<any, UserType['lastLogin']>;
  // locale: HelperType<{ localeContext: Locale }, Locale>;
  name: HelperType<any, string>;
  orders: HelperType<{ includeCarts: boolean }, Array<Order>>;
  paymentCredentials: HelperType<any, Array<PaymentCredentials>>;
  primaryEmail: HelperType<any, Email>;
  profile: HelperType<any, UserProfile>;
  quotations: HelperType<any, Array<Quotation>>;
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
  return (user.emails || []).sort(
    ({ verified: verifiedLeft }, { verified: verifiedRight }) =>
      /* @ts-ignore */
      verifiedRight - verifiedLeft
  )?.[0];
};

export const User: UserHelperTypes = {
  _id: checkTypeResolver(viewUserPublicInfos, '_id'),
  email: checkTypeResolver(viewUserPrivateInfos, 'email'),
  emails: checkTypeResolver(viewUserPrivateInfos, 'emails'),
  lastBillingAddress: checkTypeResolver(
    viewUserPrivateInfos,
    'lastBillingAddress'
  ),
  lastContact: checkTypeResolver(viewUserPrivateInfos, 'lastContact'),
  lastLogin: checkTypeResolver(viewUserPrivateInfos, 'lastLogin'),
  name: checkTypeResolver(viewUserPublicInfos, 'name'),
  profile: checkTypeResolver(viewUserPrivateInfos, 'profile'),
  roles: checkTypeResolver(viewUserPrivateInfos, 'roles'),
  tags: checkTypeResolver(viewUserPrivateInfos, 'tags'),
  username: checkTypeResolver(viewUserPrivateInfos, 'username'),

  primaryEmail: async (user, params, context) => {
    await checkAction(viewUserPrivateInfos, context, [user, params]);
    return getPrimaryEmail(user);
  },

  isEmailVerified: async (user, params, context) => {
    await checkAction(viewUserPrivateInfos, context, [user, params]);
    log(
      'user.isEmailVerified is deprecated, please use user.primaryEmail.verified',
      { level: LogLevel.Warning }
    );
    return !!getPrimaryEmail(user)?.verified;
  },
  isInitialPassword: async (user, params, context) => {
    await checkAction(viewUserPrivateInfos, context, [user, params]);
    const { password: { initial } = { initial: undefined } } =
      user.services || {};
    return user.initialPassword || !!initial;
  },
  isTwoFactorEnabled: async (user, params, context) => {
    await checkAction(viewUserPrivateInfos, context, [user, params]);
    const { 'two-factor': { secret } = { secret: undefined } } =
      user.services || {};
    return !!secret;
  },
  isGuest: async (user, params, context) => {
    await checkAction(viewUserPrivateInfos, context, [user, params]);
    return !!user.guest;
  },

  avatar: async (user, params, context) => {
    await checkAction(viewUserPublicInfos, context, [user, params]);
    return await context.modules.files.findFile({
      fileId: user.avatarId as string,
    });
  },

  bookmarks: async (user, params, context) => {
    await checkAction(viewUserPrivateInfos, context, [user, params]);
    return context.modules.bookmarks.findByUserId(user._id as string);
  },

  async cart(user, params, context) {
    const { modules, countryContext } = context;
    await checkAction(viewUserOrders, context, [user, params]);
    return await modules.orders.cart(
      { countryContext, orderNumber: params.orderNumber },
      user
    );
  },

  country: async (user, params, context) => {
    await checkAction(viewUserPrivateInfos, context, [user, params]);
    return await context.services.users.getUserCountry(user, params, context);
  },

  enrollments: async (user, params, context) => {
    await checkAction(viewUserEnrollments, context, [user, params]);
    return await context.modules.enrollments.findEnrollments({
      userId: user._id as string,
    });
  },

  language: async (user, params, context) => {
    await checkAction(viewUserPrivateInfos, context, [user, params]);
    return await context.services.users.getUserLanguage(user, params, context);
  },

  // locale: async (user, params, context) => {
  //   await checkAction(viewUserPrivateInfos, context, [user, params, context]);
  //   return context.modules.users.userLocale(user, params);
  // },

  orders: async (user, params, context) => {
    await checkAction(viewUserOrders, context, [user, params]);
    return await context.modules.orders.findOrders(
      { userId: user._id as string, includeCarts: params.includeCarts },
      {
        sort: {
          updated: -1,
        },
      }
    );
  },

  paymentCredentials: async (user, params, context) => {
    await checkAction(viewUserPrivateInfos, context, [user, params]);
    return await context.modules.payment.paymentCredentials.findPaymentCredentials(
      { ...params.selector, userId: user._id as string },
      {
        sort: {
          created: -1,
        },
      }
    );
  },

  quotations: async (user, params, context) => {
    await checkAction(viewUserQuotations, context, [user, params]);
    return await context.modules.quotations.findQuotations(
      { userId: user._id as string },
      {
        sort: {
          created: -1,
        },
      }
    );
  },
};
