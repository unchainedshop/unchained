import { Context } from '@unchainedshop/types/api';
import { User } from '@unchainedshop/types/user';
import { check, Match } from 'meteor/check';
import {
  accountsPassword,
  accountsServer,
  randomValueHex,
} from 'meteor/unchained:core-accountsjs';
import { Schemas } from 'meteor/unchained:utils';
import moniker from 'moniker';

// TODO: Check with Pascal
// accountsServer.users = Users;
export interface SetupAccountsOptions {
  mergeUserCartsOnLogin?: boolean;
}

export const setupAccounts = (
  options: SetupAccountsOptions = { mergeUserCartsOnLogin: true },
  unchainedAPI: Context
) => {
  accountsPassword.options.validateNewUser = (user: User) => {
    const customSchema = Schemas.User.extend({
      password: String,
      email: String,
    }).omit('_id', 'created', 'createdBy', 'emails', 'services');

    customSchema.validate(user);
    return customSchema.clean(user);
  };

  accountsServer.services.guest = {
    async authenticate(params: { email?: string | null }) {
      check(params.email, Match.OneOf(String, null, undefined));
      const guestname = `${moniker.choose()}-${randomValueHex(5)}`;

      const guestUserId = await unchainedAPI.modules.accounts.createUser(
        {
          email: params.email || `${guestname}@unchained.local`,
          guest: true,
          profile: {},
          password: null,
          initialPassword: true,
        },
        {}
      );
      return await unchainedAPI.modules.users.findUser({
        userId: guestUserId,
      });
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

    await unchainedAPI.modules.users.updateHeartbeat(user._id, {
      remoteAddress,
      remotePort,
      userAgent,
      locale: normalizedLocale,
      countryContext,
    });

    if (userIdBeforeLogin) {
      await unchainedAPI.services.orders.migrateOrderCarts(
        {
          fromUserId: userIdBeforeLogin,
          toUser: user,
          countryContext,
          shouldMergeCarts: options.mergeUserCartsOnLogin,
        },
        unchainedAPI
      );

      await services.bookmark.migrateBookmarks(
        {
          fromUserId: userIdBeforeLogin,
          toUserId: user._id,
          mergeBookmarks: options.mergeUserCartsOnLogin,
        },
        connection
      );
    }

    await unchainedAPI.modules.orders.ensureCartForUser(
      {
        user,
        countryContext,
      },
      unchainedAPI as Context
    );
  });

  accountsServer.on('ResetPasswordSuccess', async (user: User) => {
    await unchainedAPI.modules.users.updateInitialPassword(user, false);
  });

  accountsServer.on('ChangePasswordSuccess', async (user: User) => {
    await unchainedAPI.modules.users.updateInitialPassword(user, false);
  });

  accountsServer.on(
    'ValidateLogin',
    async (params: { service: string; user: User }) => {
      if (params.service !== 'guest' && params.user.guest) {
        await unchainedAPI.modules.users.updateGuest(params.user, false);
      }
      return true;
    }
  );
};
