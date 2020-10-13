/* eslint-disable */
import { Users } from 'meteor/unchained:core-users';

/**
 * Init the variable
 */
Roles = {}

Roles.debug = false

/**
 * Initialize variables
 */
Roles._roles = {}
Roles._actions = []
Roles._helpers = []
Roles._usersCollection = Users
Roles._specialRoles = ['__loggedIn__', '__notAdmin__', '__notLoggedIn__', '__all__']

/**
 * Old collection
 */
Roles._oldCollection = new Mongo.Collection('roles')

/**
 * Get the list of roles
 */
Roles.availableRoles = function () {
  return _.difference(_.keys(this._roles), this._specialRoles)
}

/**
 * Check if a user has a role
 */
Roles.userHasRole = function (userId, role) {
  if (role == '__all__') return true
  if (role == '__notLoggedIn__' && !userId) return true
  if (role == '__default__' && userId) return true
  if (
    role == '__notAdmin__' &&
    Roles._usersCollection.find({ _id: userId, roles: 'admin' }).count() === 0
  ) return true
  return Roles._usersCollection.find({ _id: userId, roles: role }).count() > 0
}

/**
 * Creates a new action
 */
Roles.registerAction = function (name, adminAllow, adminDeny) {
  check(name, String)
  check(adminAllow, Match.Optional(Match.Any))
  check(adminDeny, Match.Optional(Match.Any))

  if (!_.contains(this._actions, name)) {
    this._actions.push(name)
  }

  if (adminAllow) {
    Roles.adminRole.allow(name, adminAllow)
  }

  if (adminDeny) {
    Roles.adminRole.deny(name, adminDeny)
  }
}

/**
 * Creates a new helper
 */
Roles.registerHelper = function (name, adminHelper) {
  check(name, String)
  check(adminHelper, Match.Any)

  if (!_.contains(this._helpers, name)) {
    this._helpers.push(name)
  }

  if (adminHelper) {
    Roles.adminRole.helper(name, adminHelper)
  }
}

/**
 * Constructs a new role
 */
Roles.Role = function (name) {
  check(name, String)

  if (!(this instanceof Roles.Role))
    throw new Error('use "new" to construct a role')

  if (_.has(Roles._roles, name))
    throw new Error('"' + name + '" role is already defined')

  this.name = name
  this.allowRules = {}
  this.denyRules = {}
  this.helpers = {}

  Roles._roles[name] = this
}

/**
 * Adds allow properties to a role
 */
Roles.Role.prototype.allow = function (action, allow) {
  check(action, String)
  check(allow, Match.Any)

  if (!_.contains(Roles._actions, action)) {
    Roles.registerAction(action)
  }

  if (!_.isFunction(allow)) {
    var clone = _.clone(allow)
    allow = function () {
      return clone
    }
  }

  this.allowRules[action] = this.allowRules[action] || []
  this.allowRules[action].push(allow)
}

/**
 * Adds deny properties to a role
 */
Roles.Role.prototype.deny = function (action, deny) {
  check(action, String)
  check(deny, Match.Any)

  if (!_.contains(Roles._actions, action)) {
    Roles.registerAction(action)
  }

  if (!_.isFunction(deny)) {
    var clone = _.clone(deny)
    deny = function () {
      return clone
    }
  }

  this.denyRules[action] = this.denyRules[action] || []
  this.denyRules[action].push(deny)
}

/**
 * Adds a helper to a role
 */
Roles.Role.prototype.helper = function (helper, func) {
  check(helper, String)
  check(func, Match.Any)

  if (!_.contains(Roles._helpers, helper)) {
    Roles.registerHelper(helper)
  }

  if (!_.isFunction(func)) {
    var value = _.clone(func)
    func = function () {
      return value
    }
  }

  if (!this.helpers[helper]) {
    this.helpers[helper] = []
  }

  this.helpers[helper].push(func)
}

/**
 * Get user roles
 */
Roles.getUserRoles = function (userId, includeSpecial) {
  check(userId, Match.OneOf(String, null, undefined))
  check(includeSpecial, Match.Optional(Boolean))
  var object = Roles._usersCollection.findOne({ _id: userId }, { fields: { roles: 1 } })
  var roles = (object && object.roles) || []
  if (includeSpecial) {
    roles.push('__all__')
    if (!userId) {
      roles.push('__notLoggedIn__')
    } else {
      roles.push('__loggedIn__')
      if (!_.contains(roles, 'admin')) {
        roles.push('__notAdmin__')
      }
    }
  }

  return roles
}

/**
 * Calls a helper
 */
Roles.helper = function (userId, helper) {
  check(userId, Match.OneOf(String, null, undefined))
  check(helper, String)
  if (!_.contains(this._helpers, helper)) throw 'Helper "' + helper + '" is not defined'

  var args = _.toArray(arguments).slice(2)
  var context = { userId: userId }
  var responses = []
  var roles = Roles.getUserRoles(userId, true)

  _.each(roles, (role) => {
    if (this._roles[role] && this._roles[role].helpers && this._roles[role].helpers[helper]) {
      var helpers = this._roles[role].helpers[helper]
      _.each(helpers, (helper) => {
        responses.push(helper.apply(context, args))
      })
    }
  })

  return responses
}

/**
 * Returns if the user passes the allow check
 */
Roles.allow = function (userId, action) {
  check(userId, Match.OneOf(String, null, undefined))
  check(action, String)

  var args = _.toArray(arguments).slice(2)
  var self = this
  var context = { userId: userId }
  var allowed = false
  var roles = Roles.getUserRoles(userId, true)

  _.each(roles, function (role) {
    if (!allowed && self._roles[role] && self._roles[role].allowRules && self._roles[role].allowRules[action]) {
      _.each(self._roles[role].allowRules[action], function (func) {
        var allow = func.apply(context, args)
        if (allow === true) {
          allowed = true
        }
      })
    }
  })

  return allowed
}

/**
 * Returns if the user has permission using deny and deny
 */
Roles.deny = function (userId, action) {
  check(userId, Match.OneOf(String, null, undefined))
  check(action, String)

  var args = _.toArray(arguments).slice(2)
  var context = { userId: userId }
  var denied = false
  var roles = Roles.getUserRoles(userId, true)

  _.each(roles, (role) => {
    if (
      !denied &&
      this._roles[role] &&
      this._roles[role].denyRules &&
      this._roles[role].denyRules[action]
    ) {
      _.each(this._roles[role].denyRules[action], (func) => {
        var denies = func.apply(context, args)
        if (denies === true) {
          denied = true
          if (Roles.debug) {
            console.log(`[${action}] denied for ${userId} with role ${role}`)
          }
        }
      })
    }
  })

  return denied
}

/**
 * To check if a user has permisisons to execute an action
 */
Roles.userHasPermission = function () {
  var allows = this.allow.apply(this, arguments)
  var denies = this.deny.apply(this, arguments)
  return allows === true && denies === false
}

/**
 * If the user doesn't has permission it will throw a error
 */
Roles.checkPermission = function () {
  if (!this.userHasPermission.apply(this, arguments)) {
    throw new Meteor.Error('unauthorized', 'The user has no permission to perform this action')
  }
}

/**
 * Adds helpers to users
 */
Roles.setUsersHelpers = function () {
  Roles._usersCollection.helpers({
    /**
     * Returns the user roles
     */
    getRoles: function (includeSpecial) {
      return Roles.getUserRoles(this._id, includeSpecial)
    },
    /**
     * To check if the user has a role
     */
    hasRole: function (role) {
      return Roles.userHasRole(this._id, role)
    },
  })
}

Roles.setUsersHelpers()

/**
 * The admin role, who recives the default actions.
 */
Roles.adminRole = new Roles.Role('admin'); Roles._adminRole = Roles.adminRole // Backwards compatibility
/**
 * All the logged in users users
 */
Roles.loggedInRole = new Roles.Role('__loggedIn__'); Roles.defaultRole = Roles.loggedInRole // Backwards compatibility
/**
 * The users that are not admins
 */
Roles.notAdminRole = new Roles.Role('__notAdmin__')
/**
 * The users that are not logged in
 */
Roles.notLoggedInRole = new Roles.Role('__notLoggedIn__')
/**
 * Always, no exception
 */
Roles.allRole = new Roles.Role('__all__')

/**
 * A Helper to attach actions to collections easily
 */
Mongo.Collection.prototype.attachRoles = function (name, dontAllow) {
  Roles.registerAction(name + '.insert', !dontAllow)
  Roles.registerAction(name + '.update', !dontAllow)
  Roles.registerAction(name + '.remove', !dontAllow)
  Roles.registerHelper(name + '.forbiddenFields', [])

  this.allow({
    insert: function (userId, doc) {
      var allows = Roles.allow(userId, name + '.insert', userId, doc)
      if (Roles.debug && !allows) {
        console.log(`[${name}.insert] not allowed for ${userId}`)
      }

      return allows
    },

    update: function (userId, doc, fields, modifier) {
      var allows = Roles.allow(userId, name + '.update', userId, doc, fields, modifier)
      if (Roles.debug && !allows) {
        console.log(`[${name}.update] not allowed for ${userId}`)
      }

      return allows
    },

    remove: function (userId, doc) {
      var allows = Roles.allow(userId, name + '.remove', userId, doc)
      if (Roles.debug && !allows) {
        console.log(`[${name}.remove] not allowed for ${userId}`)
      }

      return allows
    }
  })

  this.deny({
    insert: function (userId, doc) {
      return Roles.deny(userId, name + '.insert', userId, doc)
    },

    update: function (userId, doc, fields, modifier) {
      return Roles.deny(userId, name + '.update', userId, doc, fields, modifier)
    },

    remove: function (userId, doc) {
      return Roles.deny(userId, name + '.remove', userId, doc)
    },
  })

  this.deny({
    insert: function (userId, doc) {
      var forbiddenFields = _.union.apply(this, Roles.helper(userId, name + '.forbiddenFields'))

      for (var i in forbiddenFields) {
        var field = forbiddenFields[i]
        if (objectHasKey(doc, field)) {
          if (Roles.debug) {
            console.log(`[${name}.forbiddenField] Field ${field} is forbidden for ${userId}`)
          }

          return true
        }
      }
    },

    update: function (userId, doc, fields, modifier) {
      var forbiddenFields = _.union.apply(this, Roles.helper(userId, name + '.forbiddenFields', doc._id))
      var types = ['$inc', '$mul', '$rename', '$setOnInsert', '$set', '$unset', '$min', '$max', '$currentDate']

      // By some reason following for will itterate even through empty array. This will prevent unwanted habbit.
      if (forbiddenFields.length === 0) {
        return false
      }

      for (var i in forbiddenFields) {
        var field = forbiddenFields[i]
        for (var j in types) {
          var type = types[j]
          if (objectHasKey(modifier[type], field)) {
            if (Roles.debug) {
              console.log(`[${name}.forbiddenField] Field ${field} is forbidden for ${userId}`)
            }

            return true
          }

          if (willChangeWithParent(modifier[type], field)) {
            if (Roles.debug) {
              console.log(`[${name}.forbiddenField] Field ${field} is forbidden for ${userId} is been changed by a parent object`)
            }

            return true
          }
        }
      }
    },
  })
}
