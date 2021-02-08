// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from 'meteor/tinytest';

// Import and rename a variable exported by core-events.js.
import { name as packageName } from 'meteor/unchained:core-events';

// Write your tests here!
// Here is an example.
Tinytest.add('core-events - example', (test) => {
  test.equal(packageName, 'core-events');
});
