import { Context } from '@unchainedshop/types/api.js';
import { NoPermissionError } from '../errors.js';

const isNotAdminAccount = async (obj: any, { userId }, { modules }: Context) => {
  const userToImpersonate = await modules.users.findUserById(userId);

  if ((userToImpersonate?.roles || []).includes('admin')) {
    throw new NoPermissionError("Cannot impersonate users with role 'admin'");
  }

  return true;
};

export const admin = (role, actions) => {
  Object.values(actions).forEach((action) => {
    role.allow(action, () => true);
  });
  role.allow(actions.impersonate, isNotAdminAccount);
};
