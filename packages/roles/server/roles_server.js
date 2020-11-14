import { check, Match } from '@share911/meteor-check';
import { Users } from 'meteor/unchained:core-users';
import Roles from '../common/roles';

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
 * Set user roles
 */
Roles.setUserRoles = function (userId, roles) {
  check(userId, String);
  check(roles, Match.OneOf(String, Array));
  let userRoles = roles;
  if (!Array.isArray(userRoles)) {
    userRoles = [userRoles];
  }

  return Users.update({ _id: userId }, { $set: { userRoles } });
};

/**
 * Removes roles from a user
 */
Roles.removeUserFromRoles = function (userId, roles) {
  check(userId, String);
  check(roles, Match.OneOf(String, Array));
  let userRoles = roles;
  if (!Array.isArray(userRoles)) {
    userRoles = [userRoles];
  }

  return Users.update({ _id: userId }, { $pullAll: { userRoles } });
};

/**
 * Requires a permission to run a resolver
 */
const defaultOptions = {
  returnNull: false,
  showKey: true,
  mapArgs: (...args) => args,
};

Roles.action = function (action, userOptions) {
  const options = { ...defaultOptions, ...userOptions };
  return function (target, key, descriptor) {
    const fn = descriptor.value || target[key];
    if (typeof fn !== 'function') {
      throw new Error(
        `@Roles.action decorator can only be applied to methods not: ${typeof fn}`
      );
    }

    return {
      configurable: true,
      get() {
        const newFn = (root, params, context, ...other) => {
          const args = options.mapArgs(root, params, context, ...other);
          const hasPermission = Roles.userHasPermission(
            context.userId,
            action,
            ...args
          );
          if (hasPermission) {
            return fn(root, params, context, ...other);
          }
          if (options.returnNull) {
            return null;
          }
          const keyText = options.showKey ? ` "${action}" in "${key}"` : '';
          throw new Error(
            `The user has no permission to perform the action${keyText}`
          );
        };
        Object.defineProperty(this, key, {
          value: newFn,
          configurable: true,
          writable: true,
        });
        return newFn;
      },
    };
  };
};
