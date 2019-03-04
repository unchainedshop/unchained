// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from 'meteor/tinytest';

// Import and rename a variable exported by core-settings.js.
import { name as packageName } from 'meteor/core-settings';

// Write your tests here!
// Here is an example.
Tinytest.add('core-settings - example', (test) => {
  test.equal(packageName, 'core-settings');
});
