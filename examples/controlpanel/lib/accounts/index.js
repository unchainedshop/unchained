// Thank you very much Nicolas, this module (auth) is originally from
// https://github.com/orionsoft/meteor-apollo-accounts

import changePassword from './changePassword';
import createUser from './createUser';
import forgotPassword from './forgotPassword';
import hashPassword from './hashPassword';
import loginWithPassword from './loginWithPassword';
import logout from './logout';
import sendVerificationEmail from './sendVerificationEmail';
import resetPassword from './resetPassword';
import verifyEmail from './verifyEmail';
import userId from './userId';
import { onTokenChange, getLoginToken, setTokenStore } from './store';

export {
  changePassword,
  createUser,
  forgotPassword,
  getLoginToken,
  hashPassword,
  loginWithPassword,
  logout,
  sendVerificationEmail,
  resetPassword,
  verifyEmail,
  onTokenChange,
  setTokenStore,
  userId,
};
