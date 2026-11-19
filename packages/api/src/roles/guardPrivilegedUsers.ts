import type { RolesInterface } from '@unchainedshop/roles';
import type { Context } from '../context.ts';

export const guardPrivilegedUsers = (roles: RolesInterface, actions: Record<string, string>) => {
  const actionsOnUsers = [
    actions.impersonate,
    actions.logoutAllSessions,
    actions.manageUsers,
    actions.removeUser,
    actions.updateUser,
    actions.updateUsername,
    actions.uploadUserAvatar,
    actions.bulkUpdateUserTags,
    actions.bulkRemoveUsers,
    actions.bulkSetUserRoles,
  ];

  const grantsPrivilege = (userId: string | undefined, userRoles: string[] = []) =>
    roles.allow({ userId }, userRoles, actions.managePrivilegedUsers, [undefined, undefined]);

  const concernsPrivilegedUser = async (
    context: Context,
    params: { userId?: string; userIds?: string[]; roles?: string[] } = {},
  ) => {
    const userIds = params.userIds ?? [params.userId || context.userId].filter((id) => id !== undefined);
    const users = await Promise.all(userIds.map((userId) => context.modules.users.findUserById(userId)));
    const privileged = await Promise.all([
      ...users.flatMap((user) => (user ? [grantsPrivilege(user._id, user.roles)] : [])),
      ...(params.roles ? [grantsPrivilege(userIds[0], params.roles)] : []),
    ]);
    return privileged.some(Boolean);
  };

  const { userHasPermission } = roles;
  roles.userHasPermission = async (context, action, args) => {
    if (!(await userHasPermission(context, action, args))) return false;
    if (!actionsOnUsers.includes(action)) return true;
    if (!(await concernsPrivilegedUser(context as Context, args[1]))) return true;
    return userHasPermission(context, actions.managePrivilegedUsers, args);
  };
};
