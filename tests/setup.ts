import { spawn } from 'node:child_process';
import { wipeDatabase, disconnect } from './helpers.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

const setupInMemoryMongoDB = async () => {
  global.__MONGOD__ = await MongoMemoryServer.create({
    instance: {
      dbName: 'test',
      port: 4011,
    },
    binary: {
      version: '8.0.1',
      checkMD5: false,
    },
    // spawn: {
    //   detached: false,
    // },
  });
  process.env.MONGO_URL = `${global.__MONGOD__.getUri()}${global.__MONGOD__.opts.instance.dbName}`;
};

const startAndWaitForApp = async () => {
  return new Promise((resolve, reject) => {
    try {
      global.__SUBPROCESS_UNCHAINED__ = spawn('npm', ['start'], {
        // detached: true,
        cwd: `${process.cwd()}/examples/kitchensink`,
        env: {
          ...process.env,
          PORT: '4010',
          ROOT_URL: 'http://localhost:4010',
          NODE_ENV: 'development',
          UNCHAINED_GRIDFS_PUT_UPLOAD_SECRET: 'secret',
          UNCHAINED_DISABLE_EMAIL_INTERCEPTION: '1',
          EMAIL_WEBSITE_NAME: 'Unchained',
          EMAIL_WEBSITE_URL: 'http://localhost:4010',
          EMAIL_FROM: 'noreply@unchained.local',
          DATATRANS_SECRET: 'secret',
          DATATRANS_SIGN_KEY: '1337',
          MOCK_APIS: '1',
          APPLE_IAP_SHARED_SECRET: '71c41914012b4ad7be859f6c26432298',
          CRYPTOPAY_SECRET: 'secret',
          CRYPTOPAY_BTC_XPUB:
            'tpubDDsGg7jiaNfukcctBwCogVUqdfU7p7X4Uoge2FNCk64YD6THTBxdGahRuAq9uuJxFErJuihg7RdgbG3YHW5AgT17f7m6MAQjauiUAPJytQG',
          CRYPTOPAY_ETH_XPUB:
            'xpub6DWGtXnV4tfoCvDZyao1zh4664ZZ7hw2TFgGiKskeAZ1ga2Uen8epiDQzaHYrFkn2X5wf6sbTgpHqsNzaTuGstEhmN2nR2szqGyoWuiYHrf',
          SAFERPAY_CUSTOMER_ID: '274656',
          SAFERPAY_USER: 'API_274656_75522257',
        },
      });
      global.__SUBPROCESS_UNCHAINED__.stdout.on('data', (data) => {
        const dataAsString = `${data}`;
        if (process.env.DEBUG) {
          console.log(dataAsString); // eslint-disable-line
        }
        if (
          dataAsString.indexOf("Can't listen") !== -1 ||
          dataAsString.indexOf('already in use') !== -1 ||
          dataAsString.indexOf('EADDRINUSE') !== -1
        ) {
          reject(dataAsString);
        }
        if (
          dataAsString.indexOf('Server listening at ') !== -1 ||
          dataAsString.indexOf('Server ready at ') !== -1
        ) {
          resolve(dataAsString.substring(19));
        }
      });
      global.__SUBPROCESS_UNCHAINED__.stderr.on('data', (data) => {
        const dataAsString = `${data}`;
        if (process.env.DEBUG) {
          console.warn(dataAsString); // eslint-disable-line
        }
        if (dataAsString.indexOf("Can't listen") !== -1) {
          reject(dataAsString);
        }
        if (dataAsString.indexOf('Server ready at ') !== -1) {
          resolve(dataAsString.substring(19));
        }
      });
    } catch (e) {
      reject(e.message);
    }
  });
};

if (!global.__SUBPROCESS_UNCHAINED__) {
  await setupInMemoryMongoDB();
  await startAndWaitForApp();
  await wipeDatabase();
}

async function teardown() {
  // if (!globalConfig.watch && !globalConfig.watchAll) {
  try {
    await disconnect();
    global.__SUBPROCESS_UNCHAINED__.kill();
    global.__MONGOD__.stop();
  } catch {
    /* */
  }
  // }
}

// do something when app is closing
process.on('exit', teardown);

// catches ctrl+c event
process.on('SIGINT', teardown);

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', teardown);
process.on('SIGUSR2', teardown);

// catches uncaught exceptions
process.on('uncaughtException', teardown);
