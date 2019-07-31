// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from 'meteor/tinytest';

// Import and rename a variable exported by core-settings.js.
import { name as packageName } from 'meteor/unchained:core-settings';

// Write your tests here!
// Here is an example.
Tinytest.add('unchained:core-settings - example', test => {
  test.equal(packageName, 'unchained:core-settings');
});
