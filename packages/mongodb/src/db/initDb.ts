import { MongoInternals } from 'meteor/mongo';
import { Db } from 'mongodb';

// import { MongoClient } from 'mongodb';
// import { log, LogTextColor } from './utils/log';

// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
// const url = process.env.MONGO_URL || 'mongodb://localhost:27017';
// const client = new MongoClient(url);

const initDb = (): Db => {
  /* TODO
  // Use connect method to connect to the server
  log('Initialise MongoDB database', { color: LogTextColor.Crimson });
  await client.connect();
  log('Client successfully connected', { color: LogTextColor.Crimson });
  const db = client.db(dbName);
  log('Dabase successfully initialised', { color: LogTextColor.Crimson });
  return db
  */
  return MongoInternals.defaultRemoteCollectionDriver().mongo.db as unknown as Db;
};

export { initDb };
