import { Context } from '@unchainedshop/types/api.js';
import { ImpersonatingAdminUserError } from '../errors.js';

const isNotAdminAccount = async (obj: any, { userId }, { modules }: Context) => {
  const userToImpersonate = await modules.users.findUserById(userId);
  if ((userToImpersonate?.roles || []).includes('admin')) {
    throw new ImpersonatingAdminUserError({ userId });
  }

  return true;
};

export const admin = (role, actions) => {
  role.allow(actions.impersonate, isNotAdminAccount);
  Object.values(actions).forEach((action) => {
    role.allow(action, () => true);
  });
};
