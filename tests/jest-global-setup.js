import setupInMemoryMongoDB from '@shelf/jest-mongodb/setup';
import { spawn } from 'child_process';
import { wipeDatabase } from './helpers';

let meteorProcess = null;
let mongoDBRunning = false;

const startAndWaitForMeteor = async () => {
  return new Promise((resolve, reject) => {
    try {
      if (meteorProcess) {
        global.__SUBPROCESS_METEOR__ = meteorProcess;
        global.__SUBPROCESS_METEOR__.ref();
        resolve();
        return;
      }
      global.__SUBPROCESS_METEOR__ = spawn(
        'meteor',
        ['--no-release-check', `--no-lint`],
        {
          detached: true,
          cwd: `${process.cwd()}/examples/minimal`,
          env: {
            STRIPE_SECRET: 'secret', // the test key should be kept secret also, that's why this could be overwritten
            ...process.env,
            NODE_ENV: 'development',
            METEOR_PACKAGE_DIRS: '../../packages',
            UNCHAINED_DISABLE_EMAIL_INTERCEPTION: 1,
            DATATRANS_SECRET: 'secret',
            DATATRANS_SIGN_KEY: '1337',
            APPLE_IAP_SHARED_SECRET: '73b61776e7304f8ab1c2404df9192078',
          },
        },
      );
      meteorProcess = global.__SUBPROCESS_METEOR__;
      global.__SUBPROCESS_METEOR__.stdout.on('data', (data) => {
        const dataAsString = `${data}`;
        if (process.env.DEBUG) {
          console.log(dataAsString); // eslint-disable-line
        }
        if (dataAsString.indexOf("Can't listen") !== -1) {
          reject(dataAsString);
        }
        if (dataAsString.indexOf('App running at: ') !== -1) {
          resolve(dataAsString.substring(19));
        }
      });
    } catch (e) {
      reject(e.message);
    }
  });
};

export default async (config) => {
  if (!mongoDBRunning) {
    await setupInMemoryMongoDB(config);
    mongoDBRunning = true;
  }
  await startAndWaitForMeteor(config);
  await wipeDatabase();
};
