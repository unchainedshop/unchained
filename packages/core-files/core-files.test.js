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
import { User } from '../../tests/seeds/users';
import { getExtension, getMimeType } from './createFilesCollection/helpers';

let testCollection;
let file;
describe('Meteor Files', () => {
  beforeAll(async () => {
    // eslint-disable-next-line no-unused-vars
    testCollection = new FilesCollection({
      collectionName: 'test_files_collection',
    });
    const imageResult = await fetch(
      'https://unchained.shop/img/veloplus-screenshots.png'
    );
    const imageBuffer = await imageResult.buffer();

    file = {
      fileName: 'veloplus-screenshots.png',
      type: 'image/png',
      size: imageBuffer.length,
      buffer: imageBuffer,
    };
  });

  it('insertWithRemoteBuffer - supplying incorrect file size', async () => {
    const testOnBeforeUploadCollectionSize = new FilesCollection({
      collectionName:
        'test_onBeforeUpload_insertWithRemoteBuffer_files_collection_size',
      maxSize: 10,
      extensionRegex: /png|jpg|jpeg/i,
    });

    try {
      await testOnBeforeUploadCollectionSize.insertWithRemoteBuffer({
        file,
        userId: User._id,
      });
    } catch (e) {
      expect(e.message).toEqual('file too big');
    }
  });

  it('insertWithRemoteBuffer - supplying incorrect file size', async () => {
    const testOnBeforeUploadCollectionSize = new FilesCollection({
      collectionName:
        'test_onBeforeUpload_insertWithRemoteBuffer_files_collection_size',
      maxSize: 10000,
      extensionRegex: /txt/i,
    });
    try {
      await testOnBeforeUploadCollectionSize.insertWithRemoteBuffer({
        file,
        userId: User._id,
      });
    } catch (e) {
      expect(e.message).toEqual('filetype not allowed');
    }
  });

  it('insertWithRemoteBuffer - supplying invalid URL', async () => {
    const testOnBeforeUploadCollection = new FilesCollection({
      collectionName:
        'test_onBeforeUpload_files_collection_insertWithRemoteBuffer',
      maxSize: 10485760,
      extensionRegex: /txt/i,
    });
    // https://assets-cdn.github.com/images/modules/logos_page/Octocat.png
    // is a resolvable URL but return 404 with no downloadable
    const imageResult = await fetch(
      'https://assets-cdn.github.com/images/modules/logos_page/Octocat.png'
    );
    const imageBuffer = await imageResult.buffer();

    try {
      await testOnBeforeUploadCollection.insertWithRemoteBuffer({
        file: {
          fileName: 'Octocat.png',
          type: 'image/png',
          size: imageBuffer.length,
          buffer: imageBuffer,
        },
        userId: User._id,
      });
    } catch (e) {
      expect(e.message).toEqual("filetype isn't defined");
    }
  });

  it('insertWithRemoteBuffer - provide working url', async () => {
    const result = await testCollection.insertWithRemoteBuffer({
      file,
      userId: User._id,
    });

    const matchingObject = {
      name: result._id,
      extension: 'png',
      ext: 'png',
      extensionWithDot: '.png',
      meta: {},
      type: 'image/png',
      mime: 'image/png',
      'mime-type': 'image/png',
      size: 593040,
      userId: 'user',
      versions: {
        original: {
          size: 593040,
          type: 'image/png',
          extension: 'png',
        },
      },
      downloadRoute: '/cdn/storage',
      collectionName: 'test_files_collection',
      _id: result._id,
    };
    expect(result).toMatchObject(matchingObject);
  });

  it('insertWithRemoteURL - supplying incorrect file size', async () => {
    const testOnBeforeUploadCollectionSize = new FilesCollection({
      collectionName: 'test_onBeforeUpload_files_collection_size',
      maxSize: 10,
      extensionRegex: /txt/i,
    });
    try {
      await testOnBeforeUploadCollectionSize.insertWithRemoteURL({
        url: 'https://www.w3.org/TR/PNG/iso_8859-1.txt',
        userId: User._id,
      });
    } catch (e) {
      expect(e.message).toEqual('file too big');
    }
  });

  it('insertWithRemoteURL - supplying incorrect file type', async () => {
    const testOnBeforeUploadCollection = new FilesCollection({
      collectionName: 'test_onBeforeUpload_files_collection',
      maxSize: 10485760,
      extensionRegex: /png|jpg|jpeg/i,
    });
    try {
      await testOnBeforeUploadCollection.insertWithRemoteURL({
        url: 'https://www.w3.org/TR/PNG/iso_8859-1.txt',
        userId: User._id,
      });
    } catch (e) {
      expect(e.message).toEqual('filetype not allowed');
    }
  });

  it('insertWithRemoteURL - provide a non existent URL', async () => {
    try {
      await testCollection.insertWithRemoteURL({
        url: 'https://ihopeawebsitedoesntexistswithsuchaname.surething',
        userId: User._id,
      });
    } catch (e) {
      expect(e).toEqual({
        message:
          'request to https://ihopeawebsitedoesntexistswithsuchaname.surething/ failed, reason: getaddrinfo ENOTFOUND ihopeawebsitedoesntexistswithsuchaname.surething',
        type: 'system',
        errno: 'ENOTFOUND',
        code: 'ENOTFOUND',
      });
    }
  });

  it('insertWithRemoteURL - provide a valid but empty URL', async () => {
    try {
      await testCollection.insertWithRemoteURL({
        url:
          'https://assets-cdn.github.com/images/modules/logos_page/Octocat.png',
        userId: User._id,
      });
    } catch (e) {
      expect(e.message).toEqual('URL provided responded with 404');
    }
  });

  it('insertWithRemoteURL - provide a working url', async () => {
    const result = await testCollection.insertWithRemoteURL({
      url: 'https://unchained.shop/img/veloplus-screenshots.png',
      userId: User._id,
    });

    const matchingObject = {
      name: 'veloplus-screenshots.png',
      extension: 'png',
      ext: 'png',
      extensionWithDot: '.png',
      meta: {},
      type: 'image/png',
      mime: 'image/png',
      'mime-type': 'image/png',
      size: 593040,
      userId: 'user',
      versions: {
        original: {
          size: 593040,
          type: 'image/png',
          extension: 'png',
        },
      },
      downloadRoute: '/cdn/storage',
      collectionName: 'test_files_collection',
      _id: result._id,
    };

    expect(result).toMatchObject(matchingObject);
  });

  it('getExtension - return correct extension', async () => {
    const imageResult = await fetch(
      'https://unchained.shop/img/veloplus-screenshots.png'
    );
    const imageBuffer = await imageResult.buffer();

    const res = await getExtension('test.png', imageBuffer);
    expect(res).toMatchObject({
      ext: 'png',
      extension: 'png',
      extensionWithDot: '.png',
    });
  });

  it('getMimeType - return correct type', async () => {
    const imageResult = await fetch(
      'https://unchained.shop/img/veloplus-screenshots.png'
    );
    const imageBuffer = await imageResult.buffer();

    const res = await getMimeType(imageBuffer);
    expect(res).toMatch('image/png');
  });
});
