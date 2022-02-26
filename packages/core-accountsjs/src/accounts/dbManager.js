import MongoDBInterface from '@accounts/mongo';
import { DatabaseManager } from '@accounts/database-manager';
import { idProvider, dateProvider } from './utils/helpers';

// eslint-disable-next-line import/prefer-default-export
export const createDbManager = (db) => {
  const mongoStorage = new MongoDBInterface(db, {
    convertUserIdToMongoObjectId: false,
    convertSessionIdToMongoObjectId: false,
    idProvider,
    dateProvider,
  });

  const dbManager = new DatabaseManager({
    sessionStorage: mongoStorage,
    userStorage: mongoStorage,
  });

  return dbManager;
};
