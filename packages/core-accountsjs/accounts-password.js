import { AccountsPassword } from '@accounts/password';

export class UnchainedAccountsPassword extends AccountsPassword {}

// eslint-disable-next-line import/prefer-default-export
export const accountsPassword = new UnchainedAccountsPassword({});
