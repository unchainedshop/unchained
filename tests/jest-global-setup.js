import setupInMemoryMongoDB from '@shelf/jest-mongodb/setup';
import { spawn } from 'child_process';
import { wipeDatabase } from './helpers';

const startAndWaitForMeteor = async () => {
  return new Promise((resolve, reject) => {
    try {
      global.__SUBPROCESS_METEOR__ = spawn(
        'meteor',
        ['--no-release-check', `--no-lint`],
        {
          detached: true,
          cwd: `${process.cwd()}/examples/minimal`,
          env: {
            ...process.env,
            NODE_ENV: 'development',
            METEOR_PACKAGE_DIRS: '../../packages',
            UNCHAINED_DISABLE_EMAIL_INTERCEPTION: 1,
            DATATRANS_SECRET: 'secret',
            DATATRANS_SIGN_KEY: '1337',
            DATATRANS_API_MOCKS_PATH: '../../tests/mocks/datatrans-v2',
            APPLE_IAP_SHARED_SECRET: '73b61776e7304f8ab1c2404df9192078',
            MINIO_ENDPOINT: 'https:/minio.dev.shared.ucc.dev',
            MINIO_ACCESS_KEY: 'QXHW9W0ZPUED5Q5E32E8',
            MINIO_SECRET_KEY: '3xdYPG9HiCFIvj8MqISDkp+N0P5hYYEYkRVqoa8N',
            MINIO_BUCKET_NAME: 'unchained-test-bucket',
            MINIO_WEBHOOK_AUTH_TOKEN: 1234567,
          },
        },
      );
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

export default async (globalConfig) => {
  if (!global.__SUBPROCESS_METEOR__) {
    await setupInMemoryMongoDB(globalConfig);
    await startAndWaitForMeteor(globalConfig);
    await wipeDatabase();
  }
};
