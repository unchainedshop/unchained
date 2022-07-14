import { assert } from 'chai';
import { initDb } from '@unchainedshop/mongodb';
import { configureUsersModule } from '@unchainedshop/core-users';
import { UsersModule } from '@unchainedshop/types/user';
import { Db } from '@unchainedshop/types/common';

describe('Test exports', () => {
  let module: UsersModule;
  let db: Db;
  let userId: string;

  before(async () => {
    db = await initDb();
    module = await configureUsersModule({ db });
    assert.ok(module);
  });
  before(async () => {
    const Users = db.collection('users');
    await Users.deleteMany({});
    const insertResult = await Users.insertOne({
      emails: [],
      username: 'test.user',
      lastLogin: {},
      profile: {
        displayName: 'Test User',
        birthday: new Date('1995-01-12'),
        phoneMobile: '+41701231212',
        gender: 'Male',
      },
      guest: false,
      tags: [],
      services: {},
      roles: ['admin'],
    });

    userId = insertResult.insertedId.toHexString();
  });

  it('Check queries', async () => {
    assert.isTrue(await module.userExists({ userId }));
    assert.isFalse(await module.userExists({ userId: '123123133123ABCD' }));
    assert.equal(await module.count({ queryString: 'Test' }), 1);
    assert.equal(await module.count({ queryString: 'Urrghh' }), 0);
    assert.ok(await module.findUserById(userId));
    assert.lengthOf(await module.findUsers({ limit: 10 }), 1);
  });
});
