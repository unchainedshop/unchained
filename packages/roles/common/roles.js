import { Users } from 'meteor/unchained:core-users';
import { check, Match } from '@share911/meteor-check';
import clone from 'lodash.clone';
import { has, isFunction, willChangeWithParent, objectHasKey } from './helpers';

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
Roles.usersCollection = Users;
Roles.specialRoles = [
  '__loggedIn__',
  '__notAdmin__',
  '__notLoggedIn__',
  '__all__',
];

/**
 * Check if a user has a role
 */
Roles.userHasRole = function (userId, role) {
  if (role === '__all__') return true;
  if (role === '__notLoggedIn__' && !userId) return true;
  if (role === '__default__' && userId) return true;
  if (
    role === '__notAdmin__' &&
    Roles.usersCollection.find({ _id: userId, roles: 'admin' }).count() === 0
  )
    return true;
  return Roles.usersCollection.find({ _id: userId, roles: role }).count() > 0;
};

/**
 * Creates a new action
 */
Roles.registerAction = function (name, adminAllow, adminDeny) {
  check(name, String);
  check(adminAllow, Match.Optional(Match.Any));
  check(adminDeny, Match.Optional(Match.Any));

  if (!this.actions.includes(name)) {
    this.actions.push(name);
  }

  if (adminAllow) {
    Roles.adminRole.allow(name, adminAllow);
  }

  if (adminDeny) {
    Roles.adminRole.deny(name, adminDeny);
  }
};

/**
 * Creates a new helper
 */
Roles.registerHelper = (name, adminHelper) => {
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
  this.denyRules = {};
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

  if (!isFunction(allow)) {
    const clonedValue = clone(allow);
    allow = function () {
      return clonedValue;
    };
  }

  this.allowRules[action] = this.allowRules[action] || [];
  this.allowRules[action].push(allow);
};

/**
 * Adds deny properties to a role
 */
Roles.Role.prototype.deny = function (action, deny) {
  check(action, String);
  check(deny, Match.Any);

  if (!Roles.actions.includes(action)) {
    Roles.registerAction(action);
  }

  if (!isFunction(deny)) {
    const clonedValue = clone(deny);
    deny = function () {
      return clonedValue;
    };
  }

  this.denyRules[action] = this.denyRules[action] || [];
  this.denyRules[action].push(deny);
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

  if (!isFunction(func)) {
    const clonedValue = clone(func);
    func = function () {
      return clonedValue;
    };
  }

  if (!this.helpers[helper]) {
    this.helpers[helper] = [];
  }

  this.helpers[helper].push(func);
};

/**
 * Get user roles
 */
Roles.getUserRoles = function (userId, includeSpecial) {
  check(userId, Match.OneOf(String, null, undefined));
  check(includeSpecial, Match.Optional(Boolean));
  const object = Roles.usersCollection.findOne(
    { _id: userId },
    { fields: { roles: 1 } }
  );
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
 * Calls a helper
 */
Roles.helper = function (userId, helper, ...rest) {
  check(userId, Match.OneOf(String, null, undefined));
  check(helper, String);
  if (!this.helpers.includes(helper)) throw `Helper "${helper}" is not defined`;

  const args = Object.values(rest).slice(2);
  const context = { userId };
  const responses = [];
  const roles = Roles.getUserRoles(userId, true);

  roles.forEach((role) => {
    if (
      this.roles[role] &&
      this.roles[role].helpers &&
      this.roles[role].helpers[helper]
    ) {
      const helpers = this.roles[role].helpers[helper];
      helpers.forEach((helper) => {
        responses.push(helper.apply(context, args));
      });
    }
  });

  return responses;
};

/**
 * Returns if the user passes the allow check
 */
Roles.allow = function (userId, action) {
  check(userId, Match.OneOf(String, null, undefined));
  check(action, String);

  const args = Object.values(arguments).slice(2);
  const self = this;
  const context = { userId };
  let allowed = false;
  const roles = Roles.getUserRoles(userId, true);

  roles.forEach((role) => {
    if (
      !allowed &&
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
 * Returns if the user has permission using deny and deny
 */
Roles.deny = function (userId, action, ...rest) {
  check(userId, Match.OneOf(String, null, undefined));
  check(action, String);

  const args = Object.values(rest).slice(2);
  const context = { userId };
  let denied = false;
  const roles = Roles.getUserRoles(userId, true);

  roles.forEach((role) => {
    if (
      !denied &&
      this.roles[role] &&
      this.roles[role].denyRules &&
      this.roles[role].denyRules[action]
    ) {
      this.roles[role].denyRules[action].forEach((func) => {
        const denies = func.apply(context, args);
        if (denies === true) {
          denied = true;
          if (Roles.debug) {
            console.log(`[${action}] denied for ${userId} with role ${role}`);
          }
        }
      });
    }
  });

  return denied;
};

/**
 * To check if a user has permisisons to execute an action
 */
Roles.userHasPermission = function (...args) {
  const allows = this.allow(...args);
  const denies = this.deny(...args);
  return allows === true && denies === false;
};

/**
 * If the user doesn't has permission it will throw a error
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
 * Adds helpers to users
 */
Roles.setUsersHelpers = function () {
  Roles.usersCollection.helpers({
    /**
     * Returns the user roles
     */
    getRoles(includeSpecial) {
      return Roles.getUserRoles(this._id, includeSpecial);
    },
    /**
     * To check if the user has a role
     */
    hasRole(role) {
      return Roles.userHasRole(this._id, role);
    },
  });
};

Roles.setUsersHelpers();

/**
 * The admin role, who recives the default actions.
 */
Roles.adminRole = new Roles.Role('admin');
/**
 * All the logged in users users
 */
Roles.loggedInRole = new Roles.Role('__loggedIn__');
/**
 * The users that are not admins
 */
Roles.notAdminRole = new Roles.Role('__notAdmin__');
/**
 * The users that are not logged in
 */
Roles.notLoggedInRole = new Roles.Role('__notLoggedIn__');
/**
 * Always, no exception
 */
Roles.allRole = new Roles.Role('__all__');

/**
 * A Helper to attach actions to collections easily
 */
Mongo.Collection.prototype.attachRoles = function (name, dontAllow) {
  Roles.registerAction(`${name}.insert`, !dontAllow);
  Roles.registerAction(`${name}.update`, !dontAllow);
  Roles.registerAction(`${name}.remove`, !dontAllow);
  Roles.registerHelper(`${name}.forbiddenFields`, []);

  this.allow({
    insert(userId, doc) {
      const allows = Roles.allow(userId, `${name}.insert`, userId, doc);
      if (Roles.debug && !allows) {
        console.log(`[${name}.insert] not allowed for ${userId}`);
      }

      return allows;
    },

    update(userId, doc, fields, modifier) {
      const allows = Roles.allow(
        userId,
        `${name}.update`,
        userId,
        doc,
        fields,
        modifier
      );
      if (Roles.debug && !allows) {
        console.log(`[${name}.update] not allowed for ${userId}`);
      }

      return allows;
    },

    remove(userId, doc) {
      const allows = Roles.allow(userId, `${name}.remove`, userId, doc);
      if (Roles.debug && !allows) {
        console.log(`[${name}.remove] not allowed for ${userId}`);
      }

      return allows;
    },
  });

  this.deny({
    insert(userId, doc) {
      return Roles.deny(userId, `${name}.insert`, userId, doc);
    },

    update(userId, doc, fields, modifier) {
      return Roles.deny(
        userId,
        `${name}.update`,
        userId,
        doc,
        fields,
        modifier
      );
    },

    remove(userId, doc) {
      return Roles.deny(userId, `${name}.remove`, userId, doc);
    },
  });

  this.deny({
    insert(userId, doc) {
      const forbiddenFields = [
        ...new Set([
          ...this,
          ...Roles.helper(userId, `${name}.forbiddenFields`),
        ]),
      ];

      Object.values(forbiddenFields).forEach((i) => {
        const field = forbiddenFields[i];
        if (objectHasKey(doc, field)) {
          if (Roles.debug) {
            console.log(
              `[${name}.forbiddenField] Field ${field} is forbidden for ${userId}`
            );
          }

          return true;
        }
      });
    },

    update(userId, doc, fields, modifier) {
      const forbiddenFields = [
        ...new Set([
          ...this,
          ...Roles.helper(userId, `${name}.forbiddenFields`, doc._id),
        ]),
      ];
      const types = [
        '$inc',
        '$mul',
        '$rename',
        '$setOnInsert',
        '$set',
        '$unset',
        '$min',
        '$max',
        '$currentDate',
      ];

      // By some reason following for will itterate even through empty array. This will prevent unwanted habbit.
      if (forbiddenFields.length === 0) {
        return false;
      }

      Object.values(forbiddenFields).forEach((i) => {
        // for (const i in forbiddenFields) {
        const field = forbiddenFields[i];
        Object.values(types).forEach((j) => {
          const type = types[j];
          if (objectHasKey(modifier[type], field)) {
            if (Roles.debug) {
              console.log(
                `[${name}.forbiddenField] Field ${field} is forbidden for ${userId}`
              );
            }

            return true;
          }

          if (willChangeWithParent(modifier[type], field)) {
            if (Roles.debug) {
              console.log(
                `[${name}.forbiddenField] Field ${field} is forbidden for ${userId} is been changed by a parent object`
              );
            }

            return true;
          }
        });
      });
    },
  });
};
