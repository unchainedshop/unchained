import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { check, Match } from 'meteor/check';
import {
  accountsServer,
  accountsPassword,
} from 'meteor/unchained:core-accountsjs';
import { getFallbackLocale } from 'meteor/unchained:core';
import { Users } from 'meteor/unchained:core-users';
import { Orders } from 'meteor/unchained:core-orders';
import { Bookmarks } from 'meteor/unchained:core-bookmarks';
import { Promise } from 'meteor/promise';
import cloneDeep from 'lodash.clonedeep';
import moniker from 'moniker';

export const buildContext = (user) => {
  const locale =
    (user && user.lastLogin && user.lastLogin.locale) ||
    getFallbackLocale().normalized;
  return {
    user: user || {},
    locale,
  };
};

export default ({ mergeUserCartsOnLogin = true } = {}) => {
  accountsPassword.options.validateNewUser = (user) => {
    const clone = cloneDeep(user);
    if (clone.email) {
      clone.emails = [
        {
          address: clone.email,
          verified: false,
        },
      ];
      delete clone.email;
    }
    delete clone._id;
    Users.simpleSchema()
      .extend({
        password: String,
      })
      .omit('created')
      .validate(clone);
    return user;
  };

  accountsServer.on('CreateUserSuccess', async ({ user, options }) => {
    const newUser = user;
    newUser.created = newUser.createdAt || new Date();
    delete newUser.createdAt; // comes from the meteor-apollo-accounts stuff
    if (newUser.services.google) {
      newUser.profile = {
        name: newUser.services.google.name,
        ...newUser.profile,
      };
      newUser.emails = [
        { address: newUser.services.google.email, verified: true },
      ];
    }
    if (newUser.services.facebook) {
      newUser.profile = {
        name: newUser.services.facebook.name,
        ...newUser.profile,
      };
      newUser.emails = [
        { address: newUser.services.facebook.email, verified: true },
      ];
    }
    if (!newUser.guest && !options?.skipEmailVerification) {
      accountsPassword.sendVerificationEmail(
        Users.findOne({ _id: user._id }).primaryEmail()?.address,
      );
    }
    return newUser;
  });

  accountsServer.removeOldGuests = (before) => {
    let newBefore = before;
    if (typeof newBefore === 'undefined') {
      newBefore = new Date();
      newBefore.setHours(newBefore.getHours() - 1);
    }
    const res = Meteor.users.remove({
      created: { $lte: newBefore },
      guest: true,
    });
    return res;
  };

  function createGuestOptions(email) {
    check(email, Match.OneOf(String, null, undefined));
    const guestname = `${moniker.choose()}-${Random.hexString(5)}`;
    return {
      email: email || `${guestname}@unchained.local`,
      guest: true,
      profile: {},
    };
  }

  accountsServer.services.guest = {
    async authenticate(params) {
      const guestOptions = createGuestOptions(params.email);
      const userId = await accountsPassword.createUser(guestOptions);
      return userId;
    },
  };

  accountsServer.on('LoginSuccess', async ({ user, connection = {} }) => {
    const {
      userIdBeforeLogin,
      countryContext,
      remoteAddress,
      normalizedLocale,
    } = connection;

    Users.updateHeartbeat({
      _id: user._id,
      remoteAddress,
      locale: normalizedLocale,
      countryContext,
    });
    if (userIdBeforeLogin) {
      Promise.await(
        Orders.migrateCart({
          fromUserId: userIdBeforeLogin,
          toUserId: user._id,
          locale: normalizedLocale,
          countryContext,
          mergeCarts: mergeUserCartsOnLogin,
        }),
      );
      Promise.await(
        Bookmarks.migrateBookmarks({
          fromUserId: userIdBeforeLogin,
          toUserId: user._id,
          mergeBookmarks: mergeUserCartsOnLogin,
        }),
      );
    }
  });

  accountsServer.on('ValidateLogin', ({ service, user, connection }) => {
    if (service !== 'guest' && user.guest) {
      Users.update(
        { _id: user._id },
        {
          $set: {
            guest: false,
          },
        },
      );
    }
    return true;
  });
};
