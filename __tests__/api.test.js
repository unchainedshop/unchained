const {MongoClient} = require('mongodb');
const { spawn } = require('child_process');

describe('insert', () => {
  let connection;
  let db;
  let apolloFetch;

  beforeAll(async () => {
    console.log(global.__MONGO_URI__);
    connection = await MongoClient.connect(global.__MONGO_URI__, {useNewUrlParser: true});
    db = await connection.db(global.__MONGO_DB_NAME__);
    apolloFetch = createApolloFetch({ uri: global.__SUBPROCESS_METEOR_ROOT_URL__ + '/graphql' });
  });

  afterAll(async () => {
    await connection.close();
  });

  it('should insert a doc into collection', async () => {
    const shopInfo = await apolloFetch({ query: /*graphql*/`
      query {
        shopInfo {
          _id
        }
      }
    `})
    console.log(shopInfo)

    const users = db.collection('users');

    const mockUser = {_id: 'some-user-id', name: 'Johnny'};
    await users.insertOne(mockUser);

    const insertedUser = await users.findOne({_id: 'some-user-id'});
    expect(insertedUser).toEqual(mockUser);
  });
});
