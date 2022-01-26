// copied from https://github.com/orangecms/jest-meteor-stubs/blob/master/lib/meteor/meteor.js
import { Mongo } from './mongo';

export const Meteor = {
  isServer: true,
  loginWithPassword: jest.fn(),
  loginWithFacebook: jest.fn(),
  methods: jest.fn(),
  call: jest.fn(),
  publish: jest.fn(),
  subscribe: jest.fn(),
  user: jest.fn(),
  users: new Mongo.Collection(),
  userId: jest.fn().mockReturnValue('f00bar'),
  startup: jest.fn(),
  bindEnvironment: jest.fn(),
  wrapAsync: jest.fn(),
  Error: jest.fn(Error),
};
