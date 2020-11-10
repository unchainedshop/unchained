import { log } from 'meteor/unchained:core-logger';
import { accountsPassword } from 'meteor/unchained:core-accountsjs';

export default async function sendEnrollmentEmail(root, { email }) {
  log('mutation sendEnrollmentEmail', { email });
  try {
    await accountsPassword.sendEnrollmentEmail(email);
    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
    };
  }
}
