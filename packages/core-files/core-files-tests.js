// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by core-files.js.
import { name as packageName } from "meteor/core-files";

// Write your tests here!
// Here is an example.
Tinytest.add("core-files - example", test => {
  test.equal(packageName, "core-files");
});
