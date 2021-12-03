import { accountsPassword } from './accounts/accounts-password';
import { accountsServer } from './accounts/accounts-server';

export const accountsSettings = {
  load({ server = {}, password = {} } = {}) {
    accountsPassword.options.sendVerificationEmailAfterSignup = false;
    Object.keys(server).forEach((key) => {
      accountsServer.options[key] = server[key];
    });
    Object.keys(password).forEach((key) => {
      accountsPassword.options[key] = password[key];
    });
  },
};
