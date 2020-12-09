import { Meteor } from 'meteor/meteor';
import { Users } from 'meteor/unchained:core-users';
import clone from 'lodash.clone';
import { has, isFunction } from './helpers';

interface RoleInterface {
  name: string
  allowRules: {
    [name: string]: any
  }
  helpers: {}
}

interface RolesInterface {
  roles: {
    [name: string]: RoleInterface;
  }
  actions: string[]
  helpers: string[]
  registerAction(name: string): void
  registerHelper(name: string): void
  getUserRoles(userId: string, includeSpecial: boolean): string[]
  allow(userId: string, action: any): boolean
  userHasPermission(userId: string, action: any): boolean
  addUserToRoles(userId: string, roles: string | string[]): any
  checkPermission(userId: string, action: any): void | never
  adminRole?: RoleInterface
  loggedInRole?: RoleInterface
  allRole?: RoleInterface
}

export const Roles: RolesInterface = {
  roles: {},
  actions: [],
  helpers: [],
  /**
  * Creates a new action
  */
  registerAction: function (name: string): void {
    if (!this.actions.includes(name)) {
      this.actions.push(name);
    }
  },

  /**
   * Creates a new helper
   */
  registerHelper: function (name: string): void {
    if (!this.helpers.includes(name)) {
      this.helpers.push(name);
    }
  },

  /**
   * Get user roles
   */
  getUserRoles: (userId: string, includeSpecial: boolean) => {
    const object = Users.findOne({ _id: userId }, { fields: { roles: 1 } });
    const roles = (object && object.roles) || [];
    if (includeSpecial) {
      roles.push('__all__');
      if (!userId) {
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
  allow: function (userId, action) {
    // eslint-disable-next-line prefer-rest-params
    const args = Object.values(arguments).slice(2);
    const self = this;
    const context = { userId };
    let allowed = false;
    const roles = Roles.getUserRoles(userId, true);

    roles.forEach((role) => {
      if (
        self.roles[role] &&
        self.roles[role].allowRules &&
        self.roles[role].allowRules[action]
      ) {
        self.roles[role].allowRules[action].forEach((func: any) => {
          const allow = func.apply(context, args);
          if (allow === true) {
            allowed = true;
          }
        });
      }
    });

    return allowed;
  },


  /**
   * To check if a user has permisisons to execute an action
   */
  userHasPermission: function (userId, action) {
    const allows = this.allow(userId, action);
    return allows === true;
  },

  /**
   * Adds roles to a user
   */
  addUserToRoles: function (userId: string, roles: string | string[]) {
    let userRoles = roles;
    if (!Array.isArray(userRoles)) {
      userRoles = [userRoles];
    }

    return Users.update(
      { _id: userId },
      { $addToSet: { roles: { $each: userRoles } } }
    );
  },

  /**
   * If the user doesn't has permission it will throw a error
   * Roles.userHasPermission(userId, action, [extra])
   */
  checkPermission: function (userId, action) {
    if (!this.userHasPermission(userId, action)) {
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

  allowRules: { [name: string]: any; };
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

