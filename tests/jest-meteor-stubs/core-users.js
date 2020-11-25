const Fiber = require('fibers');
const Future = require('fibers/future');
const wrapInFiber = require('./wrapInFiber');

const fn = Future.wrap(wrapInFiber);
const future = new Future();
console.log('FARSIGHT:', future);
Fiber(function () {
  const db = fn({
    url: global.__MONGO_URI__,
    config: { useNewUrlParser: true, useUnifiedTopology: true },
    databaseName: global.__MONGO_DB_NAME__,
    collections: ['users'],
  }).wait();
  console.log('SUPPOSED VALUE: ', db);
  return future.return(db.users);
}).run();

console.log('EXPORTED FUTURE: ', future);

module.exports.Users = future;
