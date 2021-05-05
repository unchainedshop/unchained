// copied from https://github.com/orangecms/jest-meteor-stubs/blob/master/lib/meteor/meteor.js
const { Mongo } = require('./mongo');

const Meteor = {
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
  bindEnvironment: (fn) => {
    return fn;
  },
  wrapAsync: jest.fn(),
  Error: jest.fn(Error),
};

module.exports = { Meteor };
