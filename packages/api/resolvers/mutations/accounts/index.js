import { actions } from '../../../roles';
import { checkResolver as acl } from '../../../acl';
import loginWithPassword from './loginWithPassword';
import loginAsGuest from './loginAsGuest';
import logout from './logout';
import changePassword from './changePassword';
import createUser from './createUser';
import verifyEmail from './verifyEmail';
import resendVerificationEmail from './resendVerificationEmail';
import forgotPassword from './forgotPassword';
import resetPassword from './resetPassword';
import oauth from './oauth';

const options = {
  loginWithFacebook: true,
  loginWithGoogle: true,
  loginWithLinkedIn: true,
  loginWithPassword: true
};

export default {
  logout,
  loginAsGuest,
  verifyEmail,
  loginWithPassword,
  createUser,
  forgotPassword,
  resetPassword,
  resendVerificationEmail,
  changePassword,
  ...oauth(options)
};
