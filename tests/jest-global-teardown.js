import teardownInMemoryMongoDB from '@shelf/jest-mongodb/lib/teardown.js';
import { disconnect } from './helpers.js';

async function cleanup() {
  global.__SUBPROCESS_UNCHAINED__.unref();
  global.__SUBPROCESS_UNCHAINED__.kill('SIGHUP');
  return teardownInMemoryMongoDB();
}

export default async function teardown(globalConfig) {
  if (!globalConfig.watch && !globalConfig.watchAll) {
    try {
      await disconnect();
      await cleanup();
    } catch (e) {
      /* */
    }
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
