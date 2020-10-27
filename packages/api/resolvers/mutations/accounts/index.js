import loginWithPassword from './loginWithPassword';
import loginAsGuest from './loginAsGuest';
import logout from './logout';
import changePassword from './changePassword';
import createUser from './createUser';
import verifyEmail from './verifyEmail';
import resendVerificationEmail from './resendVerificationEmail';
import sendEnrollmentEmail from './sendEnrollmentEmail';
import forgotPassword from './forgotPassword';
import resetPassword from './resetPassword';

export default {
  logout,
  loginAsGuest,
  verifyEmail,
  loginWithPassword,
  createUser,
  forgotPassword,
  resetPassword,
  resendVerificationEmail,
  sendEnrollmentEmail,
  changePassword,
};
