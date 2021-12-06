import { Locale } from 'locale';
import { actions } from '../../roles';
import { checkAction, checkTypeResolver } from '../../acl';
import { User as UserType, UserHelperTypes } from '@unchainedshop/types/user';
import { systemLocale } from 'meteor/unchained:utils';
import { log, LogLevel } from 'meteor/unchained:logger';

// import { logs } from '../transformations/helpers/logs';

const {
  viewUserPrivateInfos,
  viewUserPublicInfos,
  viewUserOrders,
  viewUserEnrollments,
  viewUserQuotations,
} = actions as Record<string, string>;

const getUserLocale = (
  user: UserType,
  params: { localeContext?: Locale } = {}
) => {
  const locale =
    params.localeContext ||
    (user.lastLogin?.locale && new Locale(user.lastLogin.locale)) ||
    systemLocale;
  return locale;
};

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
  telNumber: checkTypeResolver(viewUserPrivateInfos, 'telNumber'),
  username: checkTypeResolver(viewUserPrivateInfos, 'username'),

  primaryEmail: (user, params, context) => {
    checkAction(viewUserPrivateInfos, context.userId, [user, params, context]);
    return getPrimaryEmail(user);
  },

  isEmailVerified: (user, params, context) => {
    checkAction(viewUserPrivateInfos, context.userId, [user, params, context]);
    log(
      'user.isEmailVerified is deprecated, please use user.primaryEmail.verified',
      { level: LogLevel.Warning }
    );
    return !!getPrimaryEmail(user)?.verified;
  },
  isInitialPassword: (user, params, context) => {
    checkAction(viewUserPrivateInfos, context.userId, [user, params, context]);
    const { password: { initial } = { initial: undefined } } =
      user.services || {};
    return user.initialPassword || !!initial;
  },
  isTwoFactorEnabled: (user, params, context) => {
    checkAction(viewUserPrivateInfos, context.userId, [user, params, context]);
    const { 'two-factor': { secret } = { secret: undefined } } =
      user.services || {};
    return !!secret;
  },
  isGuest: (user, params, context) => {
    checkAction(viewUserPrivateInfos, context.userId, [user, params, context]);
    return !!user.guest;
  },

  async avatar(user, params, context) {
    checkAction(viewUserPublicInfos, context.userId, [user, params, context]);
    return await context.modules.files.findFile({
      fileId: user.avatarId as string,
    });
  },

  async bookmarks(user, params, context) {
    const { userId, modules } = context;
    checkAction(viewUserPrivateInfos, userId, [user, params, context]);
    return modules.bookmarks.findByUserId(user._id as string);
  },

  async cart(user, params, context) {
    const { countryContext, userId } = context;
    checkAction(viewUserOrders, userId, [user, params, context]);
    return user.cart({ countryContext, ...params });
  },

  country: async (user, params, context) => {
    checkAction(viewUserPrivateInfos, context.userId, [user, params, context]);
    const userLocale = getUserLocale(user, params);
    return await context.modules.countries.findCountry({
      isoCode: userLocale.country.toUpperCase(),
    });
  },

  enrollments: checkTypeResolver(viewUserEnrollments, 'enrollments'),

  language: async (user, params, context) => {
    checkAction(viewUserPrivateInfos, context.userId, [user, params, context]);
    const userLocale = getUserLocale(user, params);
    return await context.modules.languages.findLanguage({
      isoCode: userLocale.language,
    });
  },
  locale: (user, params, context) => {
    checkAction(viewUserPrivateInfos, context.userId, [user, params, context]);
    return getUserLocale(user, params);
  },

  orders: checkTypeResolver(viewUserOrders, 'orders'),

  async paymentCredentials(user, params, context) {
    const { userId, modules } = context;

    checkAction(viewUserPrivateInfos, userId, [user, params, context]);

    return await modules.payment.paymentCredentials.findPaymentCredentials(
      { ...params.selector, userId: user._id as string },
      {
        sort: {
          created: -1,
        },
      }
    );
  },

  quotations: checkTypeResolver(viewUserQuotations, 'quotations'),
};
