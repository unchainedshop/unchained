import { Accounts } from 'meteor/accounts-base';

export default function(email) {
  if (!email) return 'unknown';
  const { services } =
    email.indexOf('@') !== -1
      ? Accounts.findUserByEmail(email)
      : Accounts.findUserByUsername(email);

  const list = services
    .filter(key => {
      if (key === 'email') return false;
      if (key === 'resume') return false;
      return true;
    })
    .map(key => {
      if (key === 'password' && !services.password.bcrypt) {
        return 'no-password';
      }
      return key;
    });
  const allowedServices = [...Accounts.oauth.serviceNames(), 'password'];
  return list
    .filter(service => allowedServices.indexOf(service) !== -1)
    .join(', ');
}
