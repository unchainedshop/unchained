import { disconnect } from './helpers.js';

async function cleanup() {
  global.__SUBPROCESS_UNCHAINED__.kill();
  global.__MONGOD__.stop();
}

export default async function teardown(globalConfig) {
  if (!globalConfig.watch && !globalConfig.watchAll) {
    try {
      await disconnect();
      await cleanup();
    } catch {
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
