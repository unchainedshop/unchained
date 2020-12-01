import { Users } from 'meteor/unchained:core-users';
import { check, Match } from '@share911/meteor-check';
import clone from 'lodash.clone';
import { has, isFunction } from './helpers';

/**
 * Init the variable
 */
// eslint-disable-next-line import/prefer-default-export
export const Roles = {};

Roles.debug = false;

/**
 * Initialize variables
 */
Roles.roles = {};
Roles.actions = [];
Roles.helpers = [];
Roles.specialRoles = [
  '__loggedIn__',
  '__notAdmin__',
  '__notLoggedIn__',
  '__all__',
];

/**
 * Creates a new action
 */
Roles.registerAction = function (name, adminAllow) {
  check(name, String);
  check(adminAllow, Match.Optional(Match.Any));

  if (!this.actions.includes(name)) {
    this.actions.push(name);
  }

  if (adminAllow) {
    Roles.adminRole.allow(name, adminAllow);
  }
};

/**
 * Creates a new helper
 */
Roles.registerHelper = function (name, adminHelper) {
  check(name, String);
  check(adminHelper, Match.Any);

  if (!this.helpers.includes(name)) {
    this.helpers.push(name);
  }

  if (adminHelper) {
    Roles.adminRole.helper(name, adminHelper);
  }
};

/**
 * Constructs a new role
 */
Roles.Role = function (name) {
  check(name, String);

  if (!(this instanceof Roles.Role))
    throw new Error('use "new" to construct a role');

  if (has(Roles.roles, name))
    throw new Error(`"${name}" role is already defined`);

  this.name = name;
  this.allowRules = {};
  this.helpers = {};

  Roles.roles[name] = this;
};

/**
 * Adds allow properties to a role
 */
Roles.Role.prototype.allow = function (action, allow) {
  check(action, String);
  check(allow, Match.Any);
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
};

/**
 * Adds a helper to a role
 */
Roles.Role.prototype.helper = function (helper, func) {
  check(helper, String);
  check(func, Match.Any);

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
};

/**
 * Get user roles
 */
Roles.getUserRoles = (userId, includeSpecial) => {
  check(userId, Match.OneOf(String, null, undefined));
  check(includeSpecial, Match.Optional(Boolean));
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
};

/**
 * Returns if the user passes the allow check
 */
Roles.allow = function (userId, action) {
  check(userId, Match.OneOf(String, null, undefined));
  check(action, String);
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
      self.roles[role].allowRules[action].forEach((func) => {
        const allow = func.apply(context, args);
        if (allow === true) {
          allowed = true;
        }
      });
    }
  });

  return allowed;
};

/**
 * To check if a user has permisisons to execute an action
 */
Roles.userHasPermission = function (...args) {
  const allows = this.allow(...args);
  return allows === true;
};

/**
 * Adds roles to a user
 */
Roles.addUserToRoles = function (userId, roles) {
  check(userId, String);
  check(roles, Match.OneOf(String, Array));
  let userRoles = roles;
  if (!Array.isArray(userRoles)) {
    userRoles = [userRoles];
  }

  return Users.update(
    { _id: userId },
    { $addToSet: { roles: { $each: userRoles } } }
  );
};

/**
 * If the user doesn't has permission it will throw a error
 * Roles.userHasPermission(userId, action, [extra])
 */
Roles.checkPermission = function (...args) {
  if (!this.userHasPermission(...args)) {
    throw new Meteor.Error(
      'unauthorized',
      'The user has no permission to perform this action'
    );
  }
};

/**
 * The admin role, who recives the default actions.
 */
Roles.adminRole = new Roles.Role('admin');
/**
 * All the logged in users users
 */
Roles.loggedInRole = new Roles.Role('__loggedIn__');
/**
 * Always, no exception
 */
Roles.allRole = new Roles.Role('__all__');
