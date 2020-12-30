import {
  describe,
  test,
  expect,
  it,
  beforeAll,
  afterAll,
  afterEach,
  jest,
} from '@jest/globals';
import fetch from 'isomorphic-unfetch';
import FilesCollection from './createFilesCollection/FilesCollection';
import { setupDatabase } from '../../tests/helpers';
import { User } from '../../tests/seeds/users';

let connection;
let db;

describe('Roles', () => {
  beforeAll(async () => {
    // eslint-disable-next-line no-unused-vars
    [db, connection] = await setupDatabase();
  });

  afterEach(() => {});

  afterAll(async () => {
    await connection.close();
  });

  describe('Meteor Files', () => {
    it('insertWithRemoteBuffer', async () => {
      const testCollection = new FilesCollection('test_collection');

      const imageResult = await fetch(
        'https://assets-cdn.github.com/images/modules/logos_page/Octocat.png'
      );
      const imageBuffer = await imageResult.buffer();

      const file = {
        fileName: 'Octocat.png',
        type: 'image/png',
        size: imageBuffer.length,
        buffer: imageBuffer,
      };

      const result = await testCollection.insertWithRemoteBuffer({
        file,
        userId: User._id,
      });
      console.log('RESULT: ', result);
      // const result = await FilesCollection.prototype.insertWithRemoteURL({
      //   url: 'https://unchained.shop/img/unchained-commerce-snake.svg',
      //   meta: {},
      // });
      // console.log('RESULT: ', result);
      // expect(testRole.allowRules[actionName]).toEqual(
      //   expect.arrayContaining([allowFn])
      // );
    });
  });
});
