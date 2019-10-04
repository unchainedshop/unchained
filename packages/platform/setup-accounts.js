import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { check, Match } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { getFallbackLocale } from 'meteor/unchained:core';
import { Users } from 'meteor/unchained:core-users';
import { Orders } from 'meteor/unchained:core-orders';
import cloneDeep from 'lodash.clonedeep';
import moniker from 'moniker';

const { UI_ENDPOINT } = process.env;

Accounts.urls.resetPassword = token =>
  `${UI_ENDPOINT}/set-password?token=${token}`;

Accounts.urls.verifyEmail = token =>
  `${UI_ENDPOINT}/verify-email?token=${token}`;

Accounts.urls.enrollAccount = token =>
  `${UI_ENDPOINT}/enroll-account?token=${token}`;

export const buildContext = user => {
  const locale =
    (user && user.lastLogin && user.lastLogin.locale) ||
    getFallbackLocale().normalized;
  return {
    user: user || {},
    locale
  };
};

export const configureAccountsEmailTemplates = (
  accountsTemplateName,
  templateObject
) => {
  Accounts.emailTemplates[accountsTemplateName] = {
    from: user => templateObject(null, buildContext(user)).from(),
    subject: user => templateObject(null, buildContext(user)).subject(),
    html: (user, url) => templateObject({ url }, buildContext(user)).html(),
    text: (user, url) => templateObject({ url }, buildContext(user)).text()
  };
};

export default ({ mergeUserCartsOnLogin = true } = {}) => {
  Accounts.validateNewUser(user => {
    const clone = cloneDeep(user);
    delete clone._id;
    Users.simpleSchema().validate(clone);
    return true;
  });

  Accounts.onCreateUser((options = {}, user = {}) => {
    const newUser = user;
    const { guest, skipEmailVerification, profile } = options;

    newUser.profile = profile;
    newUser.guest = !!guest;
    newUser.created = newUser.createdAt || new Date();
    delete newUser.createdAt; // comes from the meteor-apollo-accounts stuff

    if (newUser.services.google) {
      newUser.profile = {
        name: newUser.services.google.name,
        ...newUser.profile
      };
      newUser.emails = [
        { address: newUser.services.google.email, verified: true }
      ];
    }

    if (newUser.services.facebook) {
      newUser.profile = {
        name: newUser.services.facebook.name,
        ...newUser.profile
      };
      newUser.emails = [
        { address: newUser.services.facebook.email, verified: true }
      ];
    }
    if (!guest && !skipEmailVerification) {
      Meteor.setTimeout(() => {
        const { sendVerificationEmail } = Accounts._options; // eslint-disable-line
        if (sendVerificationEmail) {
          Accounts.sendVerificationEmail(user._id);
        }
      }, 1000);
    }
    return newUser;
  });

  Accounts.removeOldGuests = before => {
    let newBefore = before;
    if (typeof newBefore === 'undefined') {
      newBefore = new Date();
      newBefore.setHours(newBefore.getHours() - 1);
    }
    const res = Meteor.users.remove({
      created: { $lte: newBefore },
      guest: true
    });
    return res;
  };

  function createGuestOptions(email) {
    check(email, Match.OneOf(String, null, undefined));
    const guestname = `${moniker.choose()}-${Random.hexString(5)}`;
    return {
      username: guestname,
      email: email || `${guestname}@localhost`,
      guest: true,
      profile: {}
    };
  }

  Accounts.registerLoginHandler('guest', options => {
    if (!options || !options.createGuest) {
      return undefined;
    }
    const guestOptions = createGuestOptions(options.email);
    return {
      userId: Accounts.createUser(guestOptions)
    };
  });

  Accounts.onLogin(({ methodArguments, user }) => {
    const { userIdBeforeLogin, countryContext } =
      [...methodArguments].pop() || {};
    if (userIdBeforeLogin) {
      Orders.migrateCart({
        fromUserId: userIdBeforeLogin,
        toUserId: user._id,
        countryContext,
        mergeCarts: mergeUserCartsOnLogin
      });
    }
  });

  Accounts.validateLoginAttempt(({ type, allowed, user }) => {
    if (type !== 'guest' && allowed && user.guest) {
      Users.update(
        { _id: user._id },
        {
          $set: {
            guest: false
          }
        }
      );
    }
    return true;
  });
};
