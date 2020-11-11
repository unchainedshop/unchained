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

/**
 * Returns the userId of the specified key and deletes the key from the database
 * @param  {String}  key
 * @param  {Boolean} dontDelete True to leave the key in the database
 * @return {String}             Id of the user
 */
Roles.keys.getUserId = function (key, dontDelete) {
  check(key, String);
  check(dontDelete, Match.Optional(Boolean));

  const doc = this.collection.findOne({
    _id: key,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gte: new Date() } },
    ],
  });
  if (!doc) return;

  if (!dontDelete) {
    if (!doc.expiresAt) {
      console.log('borrando por no tener expire at');
      this.collection.remove({ _id: key });
    } else if (moment(doc.expiresAt).isBefore(moment())) {
      console.log('borrando por expire at ya pasó');
      this.collection.remove({ _id: key });
    }
  }

  return doc.userId;
};
