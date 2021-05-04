import { accountsPassword } from './accounts-password';
import { accountsServer } from './accounts-server';

const settings = {
  load({ server = {}, password = {} }) {
    accountsPassword.options.sendVerificationEmailAfterSignup = false;
    Object.keys(server).forEach((key) => {
      accountsServer.options[key] = server[key];
    });
    Object.keys(password).forEach((key) => {
      accountsPassword.options[key] = password[key];
    });
  },
};

export default settings;
