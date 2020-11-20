import { Locale } from 'locale';
import { accountsPassword, dbManager } from 'meteor/unchained:core-accountsjs';
import 'meteor/dburles:collection-helpers';
import { getFallbackLocale } from 'meteor/unchained:core';
import { Countries } from 'meteor/unchained:core-countries';
import { Languages } from 'meteor/unchained:core-languages';
import { log, Logs } from 'meteor/unchained:core-logger';
import { v4 as uuidv4 } from 'uuid';
import { Avatars, Users } from './collections';

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

Users.helpers({
  isGuest() {
    return !!this.guest;
  },
  isInitialPassword() {
    const { password: { initial } = {} } = this.services || {};
    return !!initial;
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
      getFallbackLocale();
    return locale;
  },
  avatar() {
    return Avatars.findOne({ _id: this.avatarId });
  },
  primaryEmail() {
    return (this.emails || [])
      .sort(
        ({ verified: verifiedLeft }, { verified: verifiedRight }) =>
          verifiedLeft - verifiedRight
      )
      .pop();
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
    if (!password) {
      Users.update(
        { _id: this._id },
        {
          $set: {
            'services.password.initial': true,
            updated: new Date(),
          },
        }
      );
    }
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

Users.enrollUser = async ({ password, email, displayName, address }) => {
  const params = { email };
  if (password && password !== '') {
    params.password = password;
  }

  const newUserId = await accountsPassword.createUser(params);

  Users.update(
    { _id: newUserId },
    {
      $set: {
        updated: new Date(),
        'profile.displayName': displayName || null,
        'profile.address': address || null,
        'services.password.initial': true,
      },
    }
  );
  return Users.findOne({ _id: newUserId });
};

Users.updateHeartbeat = ({ userId, ...options }) => {
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
};

Users.createUser = async ({
  username,
  roles,
  emails,
  profile,
  guest,
  ...userData
}) => {
  const userId = await accountsPassword.createUser({
    username,
    roles,
    emails,
    profile,
    guest,
    ...userData,
  });
  return Users.findOne({ _id: userId });
};
