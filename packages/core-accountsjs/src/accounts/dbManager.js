import MongoDBInterface from '@accounts/mongo';
import { MongoInternals } from 'meteor/mongo';
import { DatabaseManager } from '@accounts/database-manager';
import { idProvider, dateProvider } from './utils/helpers';

const mongoStorage = new MongoDBInterface(
  MongoInternals.defaultRemoteCollectionDriver().mongo.db,
  {
    convertUserIdToMongoObjectId: false,
    convertSessionIdToMongoObjectId: false,
    idProvider,
    dateProvider,
  }
);

// eslint-disable-next-line import/prefer-default-export
export const dbManager = new DatabaseManager({
  sessionStorage: mongoStorage,
  userStorage: mongoStorage,
});
