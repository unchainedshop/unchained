import { Schemas } from 'meteor/unchained:utils';
import { accountsPassword } from './accounts/accountsPassword';
import { accountsServer } from './accounts/accountsServer';

const defaultAutoMessagingAfterUserCreation = true;

export const accountsSettings = {
  autoMessagingAfterUserCreation: null,
  configureSettings: ({
    mergeUserCartsOnLogin = true,
    autoMessagingAfterUserCreation = defaultAutoMessagingAfterUserCreation,
    server = {},
    password = {},
  }) => {
    accountsSettings.mergeUserCartsOnLogin = mergeUserCartsOnLogin;
    accountsSettings.autoMessagingAfterUserCreation =
      autoMessagingAfterUserCreation ?? defaultAutoMessagingAfterUserCreation;

    accountsPassword.options.sendVerificationEmailAfterSignup = false;
    accountsPassword.options.validateNewUser = (user) => {
      const customSchema = Schemas.User.extend({
        password: String,
        email: String,
      }).omit('_id', 'created', 'createdBy', 'emails', 'services');

      customSchema.validate(user);
      return customSchema.clean(user);
    };

    Object.keys(server).forEach((key) => {
      accountsServer.options[key] = server[key];
    });
    Object.keys(password).forEach((key) => {
      accountsPassword.options[key] = password[key];
    });
  },
};
