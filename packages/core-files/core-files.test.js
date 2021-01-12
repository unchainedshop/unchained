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

let testCollection;
describe('Meteor Files', () => {
  beforeAll(async () => {
    // eslint-disable-next-line no-unused-vars
    testCollection = new FilesCollection('test_files_collection');
  });

  it('insertWithRemoteBuffer', async () => {
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
    const matchingObject = {
      name: result._id,
      extension: '',
      ext: '',
      extensionWithDot: '.',
      path: `assets/app/uploads/test_files_collection/${result._id}`,
      meta: {},
      type: 'image/png',
      mime: 'image/png',
      'mime-type': 'image/png',
      size: 9115,
      userId: 'user',
      versions: {
        original: {
          path: `assets/app/uploads/test_files_collection/${result._id}`,
          size: 9115,
          type: 'image/png',
          extension: '',
        },
      },
      downloadRoute: '/cdn/storage',
      collectionName: 'test_files_collection',
      isVideo: false,
      isAudio: false,
      isImage: true,
      isText: false,
      isJSON: false,
      isPDF: false,
      storagePath: 'assets/app/uploads/test_files_collection',
      _id: result._id,
    };
    expect(result).toMatchObject(matchingObject);
  });

  it('insertWithRemoteURL', async () => {
    const result = await testCollection.insertWithRemoteURL({
      url:
        'https://assets-cdn.github.com/images/modules/logos_page/Octocat.png',
      userId: User._id,
    });

    const matchingObject = {
      name: 'Octocat.png',
      extension: 'png',
      ext: 'png',
      extensionWithDot: '.png',
      path: `assets/app/uploads/test_files_collection/${result._id}.png`,
      meta: {},
      type: 'text/html; charset=utf-8',
      mime: 'text/html; charset=utf-8',
      'mime-type': 'text/html; charset=utf-8',
      size: 5142,
      userId: 'user',
      versions: {
        original: {
          path: `assets/app/uploads/test_files_collection/${result._id}.png`,
          size: 5142,
          type: 'text/html; charset=utf-8',
          extension: 'png',
        },
      },
      downloadRoute: '/cdn/storage',
      collectionName: 'test_files_collection',
      isVideo: false,
      isAudio: false,
      isImage: false,
      isText: true,
      isJSON: false,
      isPDF: false,
      storagePath: 'assets/app/uploads/test_files_collection',
      _id: result._id,
    };

    expect(result).toMatchObject(matchingObject);
  });
});
