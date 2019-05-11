import teardownInMemoryMongoDB from '@shelf/jest-mongodb/teardown';

// Stop MongoDB and Meteor
async function cleanup() {
  global.__SUBPROCESS_METEOR__.kill('SIGHUP');
  return teardownInMemoryMongoDB();
}

export default async function teardown(globalConfig) {
  global.__SUBPROCESS_METEOR__.unref();
  if (!globalConfig.watch && !globalConfig.watchAll) {
    await cleanup();
  }
}

// do something when app is closing
process.on('exit', cleanup);

// catches ctrl+c event
process.on('SIGINT', cleanup);

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', cleanup);
process.on('SIGUSR2', cleanup);

// catches uncaught exceptions
process.on('uncaughtException', cleanup);
