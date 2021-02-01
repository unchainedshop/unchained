import { accountsPassword } from './accounts-password';

const settings = {
  load() {
    accountsPassword.options.sendVerificationEmailAfterSignup = false;
  },
};

export default settings;
