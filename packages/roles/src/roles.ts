import clone from 'lodash.clone';
import type { RoleInterface, RolesInterface } from '@unchainedshop/types/roles';
import { has } from './utils/has';
import { isFunction } from './utils/isFunction';

export const Roles: RolesInterface = {
  roles: {},
  actions: [],
  helpers: [],
  /**
   * Creates a new action
   */
  registerAction(name: string): void {
    if (!this.actions.includes(name)) {
      this.actions.push(name);
    }
  },

  /**
   * Creates a new helper
   */
  registerHelper(name: string): void {
    if (!this.helpers.includes(name)) {
      this.helpers.push(name);
    }
  },

  /**
   * Get user roles
   */
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

  /**
   * Returns true if the user passes the allow check
   */
  async allow(context, roles, action, [obj, params]) {
    const userRoles = Roles.getUserRoles(context.userId, roles, true);

    return userRoles.reduce(async (roleIsAllowedPromise: Promise<boolean>, role) => {
      const roleIsAllowed = await roleIsAllowedPromise;

      if (roleIsAllowed) return true;

      if (Roles.roles[role] && Roles.roles[role].allowRules && Roles.roles[role].allowRules[action]) {
        return Roles.roles[role].allowRules[action].reduce(
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

  /**
   * To check if a user has permisisons to execute an action
   */
  userHasPermission: async (context, action, args) => {
    const roles = Array.isArray(context.user?.roles) ? context.user.roles : [];
    const allows = await Roles.allow(context, roles, action, args);
    return allows === true;
  },

  /**
   * Adds roles to a user
   */
  async addUserToRoles(context, roles) {
    let userRoles = roles;
    if (!Array.isArray(userRoles)) {
      userRoles = [userRoles];
    }

    return context.modules.users.addRoles(context.userId, userRoles);
  },
};

/**
 * Constructs a new role
 */
export class Role implements RoleInterface {
  allowRules: { [name: string]: any };

  helpers: { [name: string]: any };

  constructor(public name: string) {
    if (has(Roles.roles, name)) throw new Error(`"${name}" role is already defined`);

    this.allowRules = {};
    this.helpers = {};

    Roles.roles[name] = this as any as RoleInterface;
  }

  /**
   * Adds a helper to a role
   */
  helper(helper: string, func: any) {
    if (!Roles.helpers.includes(helper)) {
      Roles.registerHelper(helper);
    }

    let helperFn = func;

    if (!isFunction(helperFn)) {
      const clonedValue = clone(helperFn);
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
    if (!Roles.actions.includes(action)) {
      Roles.registerAction(action);
    }
    let allowFn = allow;
    if (!isFunction(allowFn)) {
      const clonedValue = clone(allowFn);
      allowFn = () => {
        return clonedValue;
      };
    }
    this.allowRules[action] = this.allowRules[action] || [];
    this.allowRules[action].push(allowFn);
  }
}

/**
 * The admin role, who recives the default actions.
 */
Roles.adminRole = new Role('admin') as any as RoleInterface;
/**
 * All the logged in users users
 */
Roles.loggedInRole = new Role('__loggedIn__') as any as RoleInterface;
/**
 * Always, no exception
 */
Roles.allRole = new Role('__all__') as any as RoleInterface;
