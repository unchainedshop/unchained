import { spawn } from 'node:child_process';
import dns from 'node:dns';
import dotenv from 'dotenv-extended';
import setupInMemoryMongoDB from '@shelf/jest-mongodb/lib/setup.js';
import { wipeDatabase } from './helpers.js';

dns.setDefaultResultOrder('ipv4first');

dotenv.load();

const startAndWaitForApp = async () => {
  return new Promise((resolve, reject) => {
    try {
      global.__SUBPROCESS_UNCHAINED__ = spawn('npm', ['start'], {
        detached: true,
        cwd: `${process.cwd()}/examples/kitchensink`,
        env: {
          ...process.env,
          MONGO_URL: `${process.env.MONGO_URL}${global.__MONGOD__.opts.instance.dbName}`,
          PORT: '4010',
          ROOT_URL: 'http://localhost:4010',
          NODE_ENV: 'development',
          UNCHAINED_GRIDFS_PUT_UPLOAD_SECRET: 'secret',
          UNCHAINED_DISABLE_EMAIL_INTERCEPTION: 1,
          EMAIL_WEBSITE_NAME: 'Unchained',
          EMAIL_WEBSITE_URL: 'http://localhost:4010',
          EMAIL_FROM: 'noreply@unchained.local',
          DATATRANS_SECRET: 'secret',
          DATATRANS_SIGN_KEY: '1337',
          MOCK_APIS: 1,
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

export default async (globalConfig) => {
  if (!global.__SUBPROCESS_UNCHAINED__) {
    await setupInMemoryMongoDB(globalConfig);
    await startAndWaitForApp(globalConfig);
    await wipeDatabase();
  }
};
