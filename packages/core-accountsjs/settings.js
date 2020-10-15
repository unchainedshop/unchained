import { accountsPassword } from './accounts-password';

const sendVerificationEmail = true;

const settings = {
  load({ sendVerificationEmailAfterSignup = sendVerificationEmail } = {}) {
    accountsPassword.options.sendVerificationEmailAfterSignup = sendVerificationEmailAfterSignup;
  },
};

export default settings;
