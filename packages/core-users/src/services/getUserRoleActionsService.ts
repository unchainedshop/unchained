import { GetUserRoleActionsService } from '@unchainedshop/types/user';
import { Roles } from 'meteor/unchained:roles';

const permissions = async (userRoles: any, allRoles: any) => {
  const actions = userRoles?.flatMap((role) => {
    const foundRole = Object.values(allRoles).find((r: any) => r.name === role);
    if (!foundRole) return [];
    return Object.entries(foundRole.allowRules || {}).flatMap(([roleName, funcs]: any) => {
      return funcs.flatMap((f) => {
        try {
          // return permissions that are by default activated for that role,
          // accidentally don't check context
          return f(null, null, null) ? [roleName] : [];
        } catch (e) {
          return [];
        }
      });
    });
  });
  return [...new Set(actions)].sort((a: any, b: any) => a.localeCompare(b));
};

export const getUserRoleActionsService: GetUserRoleActionsService = async (user, context) => {
  const userRoles = Roles.getUserRoles({ userId: user?._id }, user.roles, true);
  return permissions(userRoles, context.roles) as Promise<string[]>;
};
