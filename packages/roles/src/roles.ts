import { Meteor } from 'meteor/meteor';
import clone from 'lodash.clone';
import { Context } from '@unchainedshop/types/api';
import { has } from './utils/has';
import { isFunction } from './utils/isFunction';

interface RoleInterface {
  name: string;
  allowRules: {
    [name: string]: any;
  };
  helpers: Record<string, unknown>;
}

type CheckPermissionArgs = [obj?: any, params?: any];
interface RolesInterface {
  roles: {
    [name: string]: RoleInterface;
  };
  actions: string[];
  helpers: string[];
  registerAction(name: string): void;
  registerHelper(name: string): void;
  getUserRoles(
    context: Context,
    roles: Array<string>,
    includeSpecial: boolean
  ): string[];
  allow(
    context: Context,
    roles: Array<string>,
    action: string,
    args: CheckPermissionArgs
  ): Promise<boolean>;
  userHasPermission(
    context: Context,
    action: string,
    args: CheckPermissionArgs
  ): Promise<boolean>;
  addUserToRoles(context: Context, roles: string | string[]): Promise<any>;
  checkPermission(
    context: Context,
    action: string,
    args: CheckPermissionArgs
  ): Promise<void | never>;
  adminRole?: RoleInterface;
  loggedInRole?: RoleInterface;
  allRole?: RoleInterface;
}

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
  getUserRoles(context, roles, includeSpecial) {
    if (includeSpecial) {
      roles.push('__all__');
      if (!context.userId) {
        roles.push('__notLoggedIn__');
      } else {
        roles.push('__loggedIn__');
        if (!roles.includes('admin')) {
          roles.push('__notAdmin__');
        }
      }
    }

    return roles;
  },

  /**
   * Returns true if the user passes the allow check
   */
  async allow(context, roles, action, [obj, params]) {
    const userRoles = Roles.getUserRoles(context, roles, true);

    return userRoles.reduce(
      async (roleIsAllowedPromise: Promise<boolean>, role) => {
        const roleIsAllowed = await roleIsAllowedPromise;

        if (roleIsAllowed) return true;

        if (
          Roles.roles[role] &&
          Roles.roles[role].allowRules &&
          Roles.roles[role].allowRules[action]
        ) {
          return Roles.roles[role].allowRules[action].reduce(
            async (rulesIsAllowedPromise: Promise<boolean>, allowFn: any) => {
              const ruleIsAllowed = await rulesIsAllowedPromise;
              if (ruleIsAllowed) return true;

              return allowFn(obj, params, context);
            },
            Promise.resolve(false)
          );
        }

        return roleIsAllowed;
      },
      Promise.resolve(false)
    );
  },

  /**
   * To check if a user has permisisons to execute an action
   */
  userHasPermission: async (context, action, args) => {
    const user =
      context.user ||
      // TODO: Check with Pascal. Not sure this is needed, as it might be, that if there is a userId then the user is set as well
      (context.userId &&
        (await context.modules.users.findUser(
          { userId: context.userId },
          { projection: { roles: 1 } }
        )));

    const roles = Array.isArray(user?.roles) ? user.roles : [];

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

  /**
   * If the user doesn't has permission it will throw a error
   * Roles.userHasPermission(userId, action, [extra])
   */
  async checkPermission(context, action, args) {
    if (!(await Roles.userHasPermission(context, action, args))) {
      throw new Meteor.Error(
        'unauthorized',
        'The user has no permission to perform this action'
      );
    }
  },
};

/**
 * Constructs a new role
 */
export class Role implements RoleInterface {
  allowRules: { [name: string]: any };

  helpers: { [name: string]: any };

  constructor(public name: string) {
    if (has(Roles.roles, name))
      throw new Error(`"${name}" role is already defined`);

    this.allowRules = {};
    this.helpers = {};

    Roles.roles[name] = this;
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
      helperFn = function () {
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
  allow(action: string, allow: any) {
    if (!Roles.actions.includes(action)) {
      Roles.registerAction(action);
    }
    let allowFn = allow;
    if (!isFunction(allowFn)) {
      const clonedValue = clone(allowFn);
      allowFn = function () {
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
Roles.adminRole = new Role('admin');
/**
 * All the logged in users users
 */
Roles.loggedInRole = new Role('__loggedIn__');
/**
 * Always, no exception
 */
Roles.allRole = new Role('__all__');
