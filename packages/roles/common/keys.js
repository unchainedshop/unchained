import { check } from '@share911/meteor-check';
import Roles from './roles';

Roles.keys = {};

/**
 * Initialize the collection
 */
Roles.keys.collection = new Meteor.Collection('nicolaslopezj_roles_keys');

/**
 * Set the permissions
 * Users can request keys just for them
 */
Roles.keys.collection.allow({
  insert(userId, doc) {
    return userId === doc.userId;
  },
  remove(userId, doc) {
    return userId === doc.userId;
  },
});

/**
 * Requests a new key
 * @param  {String} userId    Id of the userId
 * @param  {Date}   expiresAt Date of expiration
 * @return {String}           Id of the key
 */
Roles.keys.request = function (userId, expiresAt) {
  check(userId, String);
  const doc = {
    userId,
    createdAt: new Date(),
  };
  if (expiresAt) {
    check(expiresAt, Date);
    doc.expiresAt = expiresAt;
  }
  return this.collection.insert(doc);
};
