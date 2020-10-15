import { AccountsPassword } from '@accounts/password';
import settings from './settings';

class UnchainedAccountsPassword extends AccountsPassword {}

// eslint-disable-next-line import/prefer-default-export
export const accountsPassword = new UnchainedAccountsPassword({
  sendVerificationEmailAfterSignup: settings.sendVerificationEmailAfterSignup,
});
