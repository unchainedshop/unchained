const teardownInMemoryMongoDB = require('@shelf/jest-mongodb/teardown')

module.exports = async function(globalConfig) {
  global.__SUBPROCESS_METEOR__.unref()
  if (!globalConfig.watch && !globalConfig.watchAll) {
    await cleanup();
  }
};

// Stop MongoDB and Meteor
async function cleanup() {
  global.__SUBPROCESS_METEOR__.kill('SIGHUP');
  return teardownInMemoryMongoDB();
}

//do something when app is closing
process.on('exit', cleanup);

//catches ctrl+c event
process.on('SIGINT', cleanup);

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', cleanup);
process.on('SIGUSR2', cleanup);

//catches uncaught exceptions
process.on('uncaughtException', cleanup);
