import type { GraphQLResolveInfo } from 'graphql';
import { checkAction } from '../roles/acl.ts';
import { actions } from '../roles/index.ts';
import type { Context } from '../context.ts';

const grantsPrivilege = (context: Context, userId: string | undefined, roles: string[] = []) =>
  context.roles!.allow({ userId }, roles, actions.managePrivilegedUsers, [undefined, undefined]);

export const guardPrivilegedUsers =
  <Params extends { userId?: string; userIds?: string[]; roles?: string[] }>(
    resolver: (root: any, params: Params, context: Context, info?: GraphQLResolveInfo) => any,
  ) =>
  async (root: any, params: Params, context: Context, info?: GraphQLResolveInfo) => {
    const userIds = params.userIds ?? [params.userId || context.userId].filter((id) => id !== undefined);
    const users = await Promise.all(userIds.map((userId) => context.modules.users.findUserById(userId)));
    const privileged = await Promise.all([
      ...users.flatMap((user) => (user ? [grantsPrivilege(context, user._id, user.roles)] : [])),
      ...(params.roles ? [grantsPrivilege(context, userIds[0], params.roles)] : []),
    ]);
    if (privileged.some(Boolean)) {
      await checkAction(context, actions.managePrivilegedUsers, [root, params], info);
    }
    return resolver(root, params, context, info);
  };
