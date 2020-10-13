/* eslint-disable */
import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import { Users } from 'meteor/unchained:core-users'

/**
 * Publish user roles
 */
Meteor.publish('nicolaslopezj_roles', function () {
  return Users.find({ _id: this.userId }, { fields: { roles: 1 } })
})

/**
 * Migrate
 */
Meteor.methods({
  nicolaslopezj_roles_migrate: function () {
    var selector = Roles._oldCollection.find({})
    console.log('migrating ' + selector.count() + ' roles...')
    selector.forEach(function (userRoles) {
      Users.update(userRoles.userId, { $set: { roles: userRoles.roles } })
      Roles._oldCollection.remove(userRoles)
    })

    console.log('roles migrated')
  },
})

/**
 * Adds roles to a user
 */
Roles.addUserToRoles = function (userId, roles) {
  check(userId, String)
  check(roles, Match.OneOf(String, Array))
  if (!_.isArray(roles)) {
    roles = [roles]
  }

  return Users.update({ _id: userId }, { $addToSet: { roles: { $each: roles } } })
}

/**
 * Set user roles
 */
Roles.setUserRoles = function (userId, roles) {
  check(userId, String)
  check(roles, Match.OneOf(String, Array))
  if (!_.isArray(roles)) {
    roles = [roles]
  }

  return Users.update({ _id: userId }, { $set: { roles: roles } })
}

/**
 * Removes roles from a user
 */
Roles.removeUserFromRoles = function (userId, roles) {
  check(userId, String)
  check(roles, Match.OneOf(String, Array))
  if (!_.isArray(roles)) {
    roles = [roles]
  }

  return Users.update({ _id: userId }, { $pullAll: { roles: roles } })
}

/**
 * Requires a permission to run a resolver
 */
const defaultOptions = {
  returnNull: false,
  showKey: true,
  mapArgs: (...args) => args
}
Roles.action = function (action, userOptions) {
  const options = { ...defaultOptions, ...userOptions }
  return function (target, key, descriptor) {
    let fn = descriptor.value || target[key]
    if (typeof fn !== 'function') {
      throw new Error(`@Roles.action decorator can only be applied to methods not: ${typeof fn}`)
    }

    return {
      configurable: true,
      get() {
        const newFn = (root, params, context, ...other) => {
          const args = options.mapArgs(root, params, context, ...other)
          const hasPermission = Roles.userHasPermission(context.userId, action, ...args)
          if (hasPermission) {
            return fn(root, params, context, ...other)
          } else {
            if (options.returnNull) {
              return null
            } else {
              const keyText = options.showKey ? ` "${action}" in "${key}"` : ''
              throw new Error(`The user has no permission to perform the action${keyText}`)
            }
          }
        }
        Object.defineProperty(this, key, {
          value: newFn,
          configurable: true,
          writable: true
        })
        return newFn
      }
    }
  }
}
