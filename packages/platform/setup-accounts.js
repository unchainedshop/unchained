import { check, Match } from 'meteor/check';
import {
  accountsServer,
  accountsPassword,
  randomValueHex,
} from 'meteor/unchained:core-accountsjs';
import { Users } from 'meteor/unchained:core-users';
import { Orders } from 'meteor/unchained:core-orders';
import { Promise } from 'meteor/promise';
import cloneDeep from 'lodash.clonedeep';
import moniker from 'moniker';

accountsServer.users = Users;

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
    const newUser = user;
    if (user?.services?.google) {
      newUser.profile = {
        name: user.services.google.name,
        ...user.profile,
      };
      newUser.emails = [
        { address: user.services.google.email, verified: true },
      ];
    }
    if (user?.services?.facebook) {
      newUser.profile = {
        name: user.services.facebook.name,
        ...user.profile,
      };
      newUser.emails = [
        { address: user.services.facebook.email, verified: true },
      ];
    }
    return newUser;
  };

  function createGuestOptions(email) {
    check(email, Match.OneOf(String, null, undefined));
    const guestname = `${moniker.choose()}-${randomValueHex(5)}`;
    return {
      email: email || `${guestname}@unchained.local`,
      guest: true,
      profile: {},
    };
  }

  accountsServer.services.guest = {
    async authenticate(params, context) {
      const guestOptions = createGuestOptions(params.email);
      const guestUser = await Users.createUser(guestOptions, context);
      return guestUser._id;
    },
  };

  accountsServer.on('CreateUserSuccess', async ({ user, connection = {} }) => {
    if (connection.isEnrollment) {
      Users.update(
        { _id: user._id },
        {
          $set: {
            'services.password.initial': true,
          },
        }
      );
    }
  });

  accountsServer.on('LoginSuccess', async ({ user, connection = {} }) => {
    const {
      userIdBeforeLogin,
      countryContext,
      remoteAddress,
      normalizedLocale,
      services,
    } = connection;

    Users.updateHeartbeat({
      userId: user._id,
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
        })
      );

      await services.migrateBookmarks(
        {
          fromUserId: userIdBeforeLogin,
          toUserId: user._id,
          mergeBookmarks: mergeUserCartsOnLogin,
        },
        connection
      );
    }
  });

  accountsServer.on('ValidateLogin', ({ service, user }) => {
    if (service !== 'guest' && user.guest) {
      Users.update(
        { _id: user._id },
        {
          $set: {
            guest: false,
          },
        }
      );
    }
    return true;
  });
};
