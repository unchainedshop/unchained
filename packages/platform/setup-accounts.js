import { check, Match } from 'meteor/check';
import {
  accountsServer,
  accountsPassword,
  randomValueHex,
} from 'meteor/unchained:core-accountsjs';
import { Users } from 'meteor/unchained:core-users';
import { Orders } from 'meteor/unchained:core-orders';
import moniker from 'moniker';

accountsServer.users = Users;

export default ({ mergeUserCartsOnLogin = true } = {}) => {
  accountsPassword.options.validateNewUser = (user) => {
    const customSchema = Users.simpleSchema()
      .extend({
        password: String,
        email: String,
      })
      .omit('created', 'emails', '_id', 'services');

    customSchema.validate(user);
    return customSchema.clean(user);
  };

  accountsServer.services.guest = {
    async authenticate(params, context) {
      check(params.email, Match.OneOf(String, null, undefined));
      const guestname = `${moniker.choose()}-${randomValueHex(5)}`;
      const guestUser = await Users.createUser(
        {
          email: params.email || `${guestname}@unchained.local`,
          guest: true,
          profile: {},
          password: null,
          initialPassword: true,
        },
        context
      );
      return guestUser;
    },
  };

  accountsServer.on('LoginTokenCreated', async (props) => {
    const { user, connection = {} } = props;
    const {
      userIdBeforeLogin,
      countryContext,
      remoteAddress,
      remotePort,
      userAgent,
      normalizedLocale,
      services,
    } = connection;

    Users.updateHeartbeat({
      userId: user._id,
      remoteAddress,
      remotePort,
      userAgent,
      locale: normalizedLocale,
      countryContext,
    });
    if (userIdBeforeLogin) {
      await Orders.migrateCart({
        fromUserId: userIdBeforeLogin,
        toUserId: user._id,
        locale: normalizedLocale,
        countryContext,
        mergeCarts: mergeUserCartsOnLogin,
      });

      await services.migrateBookmarks(
        {
          fromUserId: userIdBeforeLogin,
          toUserId: user._id,
          mergeBookmarks: mergeUserCartsOnLogin,
        },
        connection
      );
    }
    await Orders.ensureCartForUser({
      userId: user._id,
      countryContext,
    });
  });

  accountsServer.on('ResetPasswordSuccess', (user) => {
    Users.rawCollection().updateOne(
      { _id: user._id },
      {
        $set: {
          initialPassword: false,
        },
      }
    );
  });

  accountsServer.on('ChangePasswordSuccess', (user) => {
    Users.rawCollection().updateOne(
      { _id: user._id },
      {
        $set: {
          initialPassword: false,
        },
      }
    );
  });

  accountsServer.on('ValidateLogin', ({ service, user }) => {
    if (service !== 'guest' && user.guest) {
      Users.rawCollection().updateOne(
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
