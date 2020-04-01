import callMethod from '../../../callMethod';
import hashPassword from '../../../hashPassword';

export default async function (
  root,
  {
    oldPassword: oldHashedPassword,
    oldPlainPassword,
    newPassword: newHashedPassword,
    newPlainPassword,
  },
  context
) {
  if (!newHashedPassword && !newPlainPassword) {
    throw new Error('New password is required');
  }
  if (!oldHashedPassword && !oldPlainPassword) {
    throw new Error('Old password is required');
  }
  const newPassword = newHashedPassword || hashPassword(newPlainPassword);
  const oldPassword = oldHashedPassword || hashPassword(oldPlainPassword);

  const { passwordChanged } = callMethod(
    context,
    'changePassword',
    oldPassword,
    newPassword
  );
  return {
    success: passwordChanged,
  };
}
