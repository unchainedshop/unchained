import 'meteor/dburles:collection-helpers';
import { Accounts } from 'meteor/accounts-base';
import { log, Logs } from 'meteor/unchained:core-logger';
import { Countries } from 'meteor/unchained:core-countries';
import { Languages } from 'meteor/unchained:core-languages';
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
  language() {
    const locale = this.lastLogin && this.lastLogin.locale;
    if (locale) {
      return Languages.findOne({ isoCode: locale.substr(0, 2).toLowerCase() });
    }
    return null;
  },
  country() {
    const country = this.lastLogin && this.lastLogin.country;
    if (country) {
      return Countries.findOne({ isoCode: country.toUpperCase() });
    }
    return null;
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
  isEmailVerified() {
    return this.emails[0].verified;
  },
  name() {
    const { profile, emails } = this;
    if (profile && profile.displayName && profile.displayName !== '') return profile.displayName;
    return emails && emails[0].address;
  },
  updatePassword(newPassword) {
    Accounts.setPassword(this._id, newPassword);
    return this;
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
      Accounts.sendVerificationEmail(this._id);
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
    modifier.$set['profile.displayName'] = [address.firstName, address.lastName].filter(Boolean).join(' ');
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

Users.adjustGuestEmail = ({ userId, emailAddress = null }) => {
  const user = Users.findOne({ _id: userId });
  if (emailAddress && user && user.email() !== emailAddress && user.isGuest()) {
    log(`Guest ${userId} -> New E-Mail: ${emailAddress}`, { userId });
    if (user && user.emails) {
      user.emails.forEach(({ address: oldEmailAddress }) => {
        Accounts.removeEmail(userId, oldEmailAddress);
      });
    }
    Accounts.addEmail(userId, emailAddress, false);
  }
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
