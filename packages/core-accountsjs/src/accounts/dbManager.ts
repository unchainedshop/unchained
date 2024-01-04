import { randomBytes } from 'crypto';
import mongoPkg from '@accounts/mongo';
import { DatabaseManager } from '@accounts/database-manager';

// eslint-disable-next-line
// @ts-ignore
const MongoDBInterface: any = mongoPkg.default || mongoPkg;

const METEOR_ID_LENGTH = 17;

export const idProvider = () =>
  randomBytes(30)
    .toString('base64')
    .replace(/[\W_]+/g, '')
    .substr(0, METEOR_ID_LENGTH);

export const dateProvider = (date) => date || new Date();

// eslint-disable-next-line import/prefer-default-export
export const createDbManager = (db) => {
  const mongoStorage = new MongoDBInterface(db, {
    convertUserIdToMongoObjectId: false,
    convertSessionIdToMongoObjectId: false,
    idProvider,
    sessionIdProvider: idProvider,
    dateProvider,
  });

  const dbManager = new DatabaseManager({
    sessionStorage: mongoStorage,
    userStorage: mongoStorage,
  });

  return dbManager;
};
