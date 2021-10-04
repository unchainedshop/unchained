import { Promise } from 'meteor/promise';
import { Locale } from 'locale';
import {
  accountsPassword,
  accountsServer,
  dbManager,
} from 'meteor/unchained:core-accountsjs';
import 'meteor/dburles:collection-helpers';
import { systemLocale } from 'meteor/unchained:utils';
import { Countries } from 'meteor/unchained:core-countries';
import { Languages } from 'meteor/unchained:core-languages';
import { log, Logs } from 'meteor/unchained:core-logger';
import { v4 as uuidv4 } from 'uuid';
import {
  createUploadContainer,
  MediaObjects,
  removeObjects,
  uploadObjectStream,
} from 'meteor/unchained:core-files-next';
import { Users } from './collections';
import filterContext from '../filterContext';
import evaluateContext from '../evaluateContext';
import settings from '../settings';

const userAvatarUploads = createUploadContainer(
  'user-avatars',
  async (mediaTicketUploadId, linkedUserId, { userId }) => {
    const user = Users.findUser({ userId });
    if (user?.avatarId) await removeObjects(user?.avatarId);
    return Users.update(
      { _id: linkedUserId },
      {
        $set: {
          updated: new Date(),
          avatarId: mediaTicketUploadId,
        },
      }
    );
  }
);

const buildFindSelector = ({ includeGuests, queryString }) => {
  const selector = {};
  if (!includeGuests) selector.guest = { $ne: true };
  if (queryString) {
    selector.$text = { $search: queryString };
  }
  return selector;
};

Logs.helpers({
  user() {
    return (
      this.meta &&
      Users.findOne({
        _id: this.meta.userId,
      })
    );
  },
});

Users.setTags = ({ userId, tags }) => {
  Users.update(
    { _id: userId },
    {
      $set: {
        updated: new Date(),
        tags,
      },
    }
  );
};

Users.helpers({
  isGuest() {
    return !!this.guest;
  },
  isTwoFactorEnabled() {
    const { 'two-factor': { secret } = {} } = this.services || {};
    return !!secret;
  },
  isInitialPassword() {
    const { password: { initial } = {} } = this.services || {};
    return this.initialPassword || !!initial;
  },
  isEmailVerified() {
    log(
      'user.isEmailVerified is deprecated, please use user.primaryEmail.verified',
      { level: 'warn' }
    );
    return !!this.primaryEmail()?.verified;
  },
  language(options) {
    return Languages.findOne({ isoCode: this.locale(options).language });
  },
  country(options) {
    return Countries.findOne({
      isoCode: this.locale(options).country.toUpperCase(),
    });
  },
  locale({ localeContext } = {}) {
    const locale =
      localeContext ||
      (this.lastLogin?.locale && new Locale(this.lastLogin.locale)) ||
      systemLocale;
    return locale;
  },
  avatar() {
    return MediaObjects.findOne({ _id: this.avatarId });
  },
  primaryEmail() {
    return (this.emails || []).sort(
      ({ verified: verifiedLeft }, { verified: verifiedRight }) =>
        verifiedRight - verifiedLeft
    )?.[0];
  },
  email() {
    log('user.email is deprecated, please use user.primaryEmail.verified', {
      level: 'warn',
    });
    return this.primaryEmail()?.address;
  },
  telNumber() {
    return this.profile && this.profile.phoneMobile;
  },
  name() {
    const { profile } = this;
    if (profile && profile.displayName && profile.displayName !== '')
      return profile.displayName;
    return this.primaryEmail()?.address || this._id;
  },
  async setPassword(password) {
    const newPassword = password || uuidv4().split('-').pop();
    await accountsPassword.setPassword(this._id, newPassword);
  },
  setRoles(roles) {
    Users.update(
      { _id: this._id },
      {
        $set: {
          updated: new Date(),
          roles,
        },
      }
    );
    return Users.findOne({ _id: this._id });
  },
  async setUsername(username) {
    await dbManager.setUsername(this._id, username);
    return Users.findOne({ _id: this._id });
  },
  async addEmail(email, { verified = false } = {}) {
    await accountsPassword.addEmail(this._id, email, verified);
    return Users.findOne({ _id: this._id });
  },
  async removeEmail(email) {
    await accountsPassword.removeEmail(this._id, email);
    return Users.findOne({ _id: this._id });
  },
  async updateEmail(email, { verified = false } = {}) {
    log(
      'user.updateEmail is deprecated, please use user.addEmail and user.removeEmail',
      { level: 'warn' }
    );
    await accountsPassword.addEmail(this._id, email, verified);
    await Promise.all(
      (this.emails || [])
        .filter(({ address }) => address.toLowerCase() !== email.toLowerCase())
        .map(async ({ address }) =>
          accountsPassword.removeEmail(this._id, address)
        )
    );
    return Users.findOne({ _id: this._id });
  },
  logs({ limit, offset }) {
    const selector = { 'meta.userId': this._id };
    const logs = Logs.find(selector, {
      skip: offset,
      limit,
      sort: {
        created: -1,
      },
    }).fetch();
    return logs;
  },
});

Users.createSignedUploadURL = async ({ mediaName, userId }, { ...context }) => {
  const uploadedMedia = await userAvatarUploads.createSignedURL(
    userId,
    mediaName,
    {},
    context
  );
  return uploadedMedia;
};

Users.updateProfile = ({ userId, profile }) => {
  const transformedProfile = Object.keys(profile).reduce((acc, profileKey) => {
    return {
      ...acc,
      [`profile.${profileKey}`]: profile[profileKey],
    };
  }, {});

  return Users.update(
    { _id: userId },
    {
      $set: {
        updated: new Date(),
        ...transformedProfile,
      },
    }
  );
};
Users.updateAvatar = async ({ userId, avatar }) => {
  const user = Users.findUser({ userId });
  if (user?.avatarId) await removeObjects(user?.avatarId);
  const avatarRef = await uploadObjectStream('user-avatars', avatar, {
    userId,
  });
  return Users.update(
    { _id: userId },
    {
      $set: {
        updated: new Date(),
        avatarId: avatarRef._id,
      },
    }
  );
};

Users.updateLastBillingAddress = ({ userId, lastBillingAddress }) => {
  const user = Users.findOne({ _id: userId });
  log('Store Last Billing Address', { userId });
  const modifier = {
    $set: {
      lastBillingAddress,
      updated: new Date(),
    },
  };
  const profile = user.profile || {};
  const isGuest = user.isGuest();
  if (!profile.displayName || isGuest) {
    modifier.$set['profile.displayName'] = [
      lastBillingAddress.firstName,
      lastBillingAddress.lastName,
    ]
      .filter(Boolean)
      .join(' ');
  }
  return Users.update({ _id: userId }, modifier);
};

Users.updateLastContact = ({ userId, lastContact }) => {
  const user = Users.findOne({ _id: userId });
  log('Store Last Contact', { userId });
  const profile = user.profile || {};
  const isGuest = user.isGuest();
  const modifier = {
    $set: {
      updated: new Date(),
      lastContact,
    },
  };
  if ((!profile.phoneMobile || isGuest) && lastContact.telNumber) {
    // Backport the contact phone number to the user profile
    modifier.$set['profile.phoneMobile'] = lastContact.telNumber;
  }
  Users.update({ _id: userId }, modifier);
};

Users.updateHeartbeat = ({ userId, ...options }) =>
  Users.update(
    { _id: userId },
    {
      $set: {
        lastLogin: {
          timestamp: new Date(),
          ...options,
        },
      },
    }
  );

Users.userExists = ({ userId }) => {
  return !!Users.find({ _id: userId }, { limit: 1 }).count();
};

Users.findUser = ({ userId, resetToken, hashedToken }) => {
  if (hashedToken) {
    return Users.findOne({
      'services.resume.loginTokens.hashedToken': hashedToken,
    });
  }

  if (resetToken) {
    return Users.findOne({
      'services.password.reset.token': resetToken,
    });
  }
  return Users.findOne({ _id: userId });
};

Users.createUser = async (userData, context, { skipMessaging } = {}) => {
  const userId = await accountsPassword.createUser(userData, context);
  const autoMessagingEnabled = skipMessaging
    ? false
    : settings.autoMessagingAfterUserCreation && userData.email && userId;

  if (autoMessagingEnabled) {
    if (userData.password === undefined) {
      await accountsPassword.sendEnrollmentEmail(userData.email);
    } else {
      await accountsPassword.sendVerificationEmail(userData.email);
    }
  }
  return Users.findUser({ userId });
};

Users.loginWithService = async (service, params, rawContext) => {
  const context = evaluateContext(filterContext(rawContext));
  const { user: tokenUser, token: loginToken } =
    await accountsServer.loginWithService(service, params, context);
  await accountsServer.getHooks().emit('LoginTokenCreated', {
    user: tokenUser,
    connection: context,
    service,
  });
  return {
    id: tokenUser._id,
    token: loginToken.token,
    tokenExpires: loginToken.when,
  };
};

Users.buildTOTPSecret = () => {
  const authSecret = accountsPassword.twoFactor.getNewAuthSecret();
  return authSecret.otpauth_url;
};

Users.enableTOTP = async (userId, secret, code) => {
  await accountsPassword.twoFactor.set(userId, { base32: secret }, code);
  return true;
};

Users.disableTOTP = async (userId, code) => {
  await accountsPassword.twoFactor.unset(userId, code);
  // https://github.com/accounts-js/accounts/issues/1181
  const wait = async (time) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, time);
    });
  };
  await wait(500);
  return true;
};

Users.createLoginToken = async (user, rawContext) => {
  const context = evaluateContext(filterContext(rawContext));
  const { user: tokenUser, token: loginToken } =
    await accountsServer.loginWithUser(user, context);
  await accountsServer.getHooks().emit('LoginTokenCreated', {
    user: tokenUser,
    connection: context,
    service: null,
  });
  return {
    id: tokenUser._id,
    token: loginToken.token,
    tokenExpires: loginToken.when,
  };
};

Users.findUsers = async ({ limit, offset, includeGuests, queryString }) => {
  const selector = buildFindSelector({ includeGuests, queryString });
  if (queryString) {
    const userArray = await Users.rawCollection()
      .find(selector, {
        skip: offset,
        limit,
        projection: { score: { $meta: 'textScore' } },
        sort: { score: { $meta: 'textScore' } },
      })
      .toArray();
    return (userArray || []).map((item) => new Users._transform(item)); // eslint-disable-line
  }

  return Users.find(selector, { skip: offset, limit }).fetch();
};

Users.count = async (query) => {
  const count = await Users.rawCollection().countDocuments(
    buildFindSelector(query)
  );
  return count;
};
