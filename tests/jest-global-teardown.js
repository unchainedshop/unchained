import teardownInMemoryMongoDB from '@shelf/jest-mongodb/teardown';
import { disconnect } from './helpers';

async function cleanup() {
  global.__SUBPROCESS_UNCHAINED__.unref();
  global.__SUBPROCESS_UNCHAINED__.kill('SIGHUP');
  return teardownInMemoryMongoDB();
}

export default async function teardown(globalConfig) {
  if (!globalConfig.watch && !globalConfig.watchAll) {
    await disconnect();
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
