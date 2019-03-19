import 'meteor/dburles:collection-helpers';
import { Locale } from 'locale';
import { getFallbackLocale } from 'meteor/unchained:core';
import { Accounts } from 'meteor/accounts-base';
import { log, Logs } from 'meteor/unchained:core-logger';
import { Countries } from 'meteor/unchained:core-countries';
import { Languages } from 'meteor/unchained:core-languages';
import uuid from 'uuid';
import { Users, Avatars } from './collections';

Logs.helpers({
  user() {
    return this.meta && Users.findOne({
      _id: this.meta.userId,
    });
  },
});

Users.helpers({
  isGuest() {
    return !!this.guest;
  },
  isInitialPassword() {
    const {
      password: { initial } = {},
    } = this.services || {};
    return !!initial;
  },
  isEmailVerified() {
    return !!this.emails[0].verified;
  },
  language(options) {
    return Languages.findOne({ isoCode: this.locale(options).language });
  },
  country(options) {
    return Countries.findOne({ isoCode: this.locale(options).country.toUpperCase() });
  },
  locale({ localeContext } = {}) {
    const locale = localeContext
      || new Locale(this.lastLogin && this.lastLogin.locale)
      || getFallbackLocale();
    return locale;
  },
  avatar() {
    return Avatars.findOne({ _id: this.avatarId });
  },
  email() {
    return this.emails[0].address;
  },
  telNumber() {
    return this.profile && this.profile.phoneMobile;
  },
  name() {
    const { profile, emails } = this;
    if (profile && profile.displayName && profile.displayName !== '') return profile.displayName;
    return emails && emails[0].address;
  },
  updatePassword({ password, ...options } = {}) {
    const newPassword = password || uuid().split('-').pop();
    Accounts.setPassword(this._id, newPassword, options);
    if (!password) {
      Users.update({ _id: this._id }, {
        $set: {
          'services.password.initial': true,
          updated: new Date(),
        },
      });
    }
    const user = Users.findOne({ _id: this._id });
    user.password = newPassword;
    return user;
  },
  updateRoles(roles) {
    Users.update({ _id: this._id }, {
      $set: {
        updated: new Date(),
        roles,
      },
    });
    return Users.findOne({ _id: this._id });
  },
  updateEmail(email, { skipEmailVerification = false } = {}) {
    Users.update({ _id: this._id }, {
      $set: {
        updated: new Date(),
        'emails.0.address': email,
        'emails.0.verified': false,
      },
    });
    if (!skipEmailVerification) {
      const { sendVerificationEmail } = Accounts._options; // eslint-disable-line
      if (sendVerificationEmail) {
        Accounts.sendVerificationEmail(this._id);
      }
    }
    return Users.findOne({ _id: this._id });
  },
  logs({ limit = 10, offset = 0 }) {
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
    ].filter(Boolean).join(' ');
  }
  return Users.update({ _id: userId }, modifier);
};

Users.updateLastContact = ({ userId, lastContact }) => {
  const user = Users.findOne({ _id: userId });
  log('Store Last Contact Information', { userId });
  const profile = user.profile || {};
  const isGuest = user.isGuest();
  if ((!profile.phoneMobile || isGuest) && lastContact.telNumber) {
    const modifier = {
      $set: {
        'profile.phoneMobile': lastContact.telNumber,
        updated: new Date(),
      },
    };
    Users.update({ _id: userId }, modifier);
  }
};

Users.enrollUser = ({
  password, email, displayName, address,
}) => {
  const options = { email, skipEmailVerification: true };
  if (password && password !== '') {
    options.password = password;
  }
  const newUserId = Accounts.createUser(options);
  Users.update({ _id: newUserId }, {
    $set: {
      updated: new Date(),
      'profile.displayName': displayName || null,
      'profile.address': address || null,
    },
  });
  if (!options.password) {
    // send an e-mail if password is not set allowing the user to set it
    Accounts.sendEnrollmentEmail(newUserId);
  }
  return Users.findOne({ _id: newUserId });
};

Users.findOneWithHeartbeat = ({ userId, ...options }) => {
  if (Users.update({ _id: userId }, {
    $set: {
      lastLogin: {
        timestamp: new Date(),
        ...options,
      },
    },
  })) {
    return Users.findOne({ _id: userId });
  }
  return null;
};
