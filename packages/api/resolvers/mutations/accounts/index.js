import loginWithPassword from "./loginWithPassword";
import loginAsGuest from "./loginAsGuest";
import logout from "./logout";
import changePassword from "./changePassword";
import createUser from "./createUser";
import verifyEmail from "./verifyEmail";
import resendVerificationEmail from "./resendVerificationEmail";
import forgotPassword from "./forgotPassword";
import resetPassword from "./resetPassword";
import oauth from "./oauth";

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
  resendVerificationEmail,
  loginWithPassword,
  changePassword,
  createUser,
  forgotPassword,
  resetPassword,
  ...oauth(options)
};
