import { Roles } from '@unchainedshop/roles';
import { checkAction } from '../acl.ts';
import { actions } from '../roles/index.ts';
import type { Context } from '../context.ts';

const isPrivileged = (userId: string, roles: string[] = []) =>
  Roles.allow({ userId }, roles, actions.managePrivilegedUsers, [undefined, undefined]);

export const guardPrivilegedUsers =
  <Params extends { userId?: string; roles?: string[] }>(
    resolver: (root: any, params: Params, context: Context, info?: any) => any,
  ) =>
  async (root: any, params: Params, context: Context, info?: any) => {
    const userId = params.userId || context.userId;
    const user = userId ? await context.modules.users.findUserById(userId) : null;
    if (
      (user && (await isPrivileged(user._id, user.roles))) ||
      (userId && params.roles && (await isPrivileged(userId, params.roles)))
    ) {
      await checkAction(context, actions.managePrivilegedUsers, [root, params]);
    }
    return resolver(root, params, context, info);
  };
