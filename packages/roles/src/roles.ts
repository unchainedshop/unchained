import { has } from './utils/has.ts';
import { isFunction } from './utils/isFunction.ts';

interface RoleUserContext {
  userId?: string;
  user?: any;
}
export interface RoleInterface {
  name: string;
  allowRules: Record<string, any>;
  allow(action: string, fn: (root: any, props: any, context: RoleUserContext) => Promise<boolean>): void;
  helpers: Record<string, unknown>;
}

export type RoleInterfaceFactory = new (key: string) => RoleInterface;

export type CheckPermissionArgs = [obj?: any, params?: any];

export interface RolesInterface {
  roles: Record<string, RoleInterface>;
  actions: string[];
  helpers: string[];
  addRole(role: RoleInterface): RoleInterface;
  registerAction(name: string): void;
  registerHelper(name: string): void;
  getUserRoles(userId: string, roles: string[], includeSpecial: boolean): string[];
  allow(
    context: RoleUserContext,
    roles: string[],
    action?: string,
    args?: CheckPermissionArgs,
  ): Promise<boolean>;
  userHasPermission(
    context: RoleUserContext,
    action: string,
    args: CheckPermissionArgs,
  ): Promise<boolean>;
  adminRole?: RoleInterface;
  loggedInRole?: RoleInterface;
  allRole?: RoleInterface;
}

export interface IRoleOptionConfig {
  additionalRoles?: Record<string, (role: RolesInterface, actions: Record<string, string>) => void>;
  additionalActions?: string[];
}

export function createRoles(): RolesInterface {
  const instance: RolesInterface = {
    roles: {},
    actions: [],
    helpers: [],

    addRole(role: RoleInterface): RoleInterface {
      if (has(this.roles, role.name)) {
        throw new Error(`"${role.name}" role is already defined`);
      }
      this.roles[role.name] = role;
      return role;
    },

    registerAction(name: string): void {
      if (!this.actions.includes(name)) {
        this.actions.push(name);
      }
    },

    registerHelper(name: string): void {
      if (!this.helpers.includes(name)) {
        this.helpers.push(name);
      }
    },

    getUserRoles(userId, roles, includeSpecial) {
      const newRoles = [...(roles || [])];
      if (includeSpecial) {
        newRoles.push('__all__');
        if (!userId) {
          newRoles.push('__notLoggedIn__');
        } else {
          newRoles.push('__loggedIn__');
          if (!newRoles.includes('admin')) {
            newRoles.push('__notAdmin__');
          }
        }
      }

      return newRoles;
    },

    async allow(context, roles, action: string, [obj, params]: any) {
      const userRoles = instance.getUserRoles(context.userId!, roles, true);

      return userRoles.reduce(async (roleIsAllowedPromise: Promise<boolean>, role) => {
        const roleIsAllowed = await roleIsAllowedPromise;

        if (roleIsAllowed) return true;

        if (
          instance.roles[role] &&
          instance.roles[role].allowRules &&
          instance.roles[role].allowRules[action]
        ) {
          return instance.roles[role].allowRules[action].reduce(
            async (rulesIsAllowedPromise: Promise<boolean>, allowFn: any) => {
              const ruleIsAllowed = await rulesIsAllowedPromise;
              if (ruleIsAllowed) return true;

              return allowFn(obj, params, context);
            },
            Promise.resolve(false),
          );
        }

        return roleIsAllowed;
      }, Promise.resolve(false));
    },

    async userHasPermission(context, action, args) {
      const roles = Array.isArray(context.user?.roles) ? context.user.roles : [];
      const allows = await instance.allow(context, roles, action, args);
      return allows === true;
    },
  };

  return instance;
}

export const Roles: RolesInterface = createRoles();

/**
 * Constructs a new role
 */
export class Role implements RoleInterface {
  name: string;

  allowRules: Record<string, any>;

  helpers: Record<string, any>;

  constructor(name: string) {
    this.name = name;
    this.allowRules = {};
    this.helpers = {};
  }

  /**
   * Adds a helper to a role
   */
  helper(helper: string, func: any) {
    let helperFn = func;

    if (!isFunction(helperFn)) {
      const clonedValue = structuredClone(helperFn);
      helperFn = () => {
        return clonedValue;
      };
    }

    if (!this.helpers[helper]) {
      this.helpers[helper] = [];
    }

    this.helpers[helper].push(helperFn);
  }

  /**
   * Adds allow properties to a role
   */
  allow(action, allow) {
    if (!action) {
      throw new Error(`Action doesn't exist`);
    }
    let allowFn = allow;
    if (!isFunction(allowFn)) {
      const clonedValue = structuredClone(allowFn);
      allowFn = () => {
        return clonedValue;
      };
    }
    this.allowRules[action] = this.allowRules[action] || [];
    this.allowRules[action].push(allowFn);
  }
}

export function initDefaultRoles(roles: RolesInterface = Roles): void {
  if (roles.adminRole) return;
  roles.adminRole = roles.addRole(new Role('admin'));
  roles.loggedInRole = roles.addRole(new Role('__loggedIn__'));
  roles.allRole = roles.addRole(new Role('__all__'));
}
